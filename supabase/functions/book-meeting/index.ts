import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!
const GOOGLE_REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN")!
const CALENDAR_ID = Deno.env.get("GOOGLE_CALENDAR_ID") || "primary"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  })
  const data = await res.json()
  return data.access_token
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const { meeting_type, datetime, client_name, client_email, session_id, step } = await req.json()
  const accessToken = await getAccessToken()

  const startTime = new Date(datetime)
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000)

  // Create Google Calendar event
  const eventRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `ADWC: ${meeting_type} - ${client_name}`,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        attendees: [{ email: client_email }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 1440 },
            { method: "email", minutes: 60 },
          ],
        },
      }),
    }
  )
  const event = await eventRes.json()

  if (!event.id) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to create calendar event" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  // Update onboarding_sessions in Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: session } = await supabase
    .from("onboarding_sessions")
    .select("meetings")
    .eq("stripe_session_id", session_id)
    .single()

  const meetings = session?.meetings || []
  meetings.push({
    step,
    type: meeting_type,
    datetime: startTime.toISOString(),
    gcal_event_id: event.id,
  })

  const updatePayload: Record<string, unknown> = { meetings }
  if (meetings.length === 9) {
    updatePayload.status = "completed"
  }

  await supabase
    .from("onboarding_sessions")
    .update(updatePayload)
    .eq("stripe_session_id", session_id)

  let confirmationEmailSent = false
  if (meetings.length === 9) {
    try {
      const confirmResp = await fetch(`${SUPABASE_URL}/functions/v1/send-onboarding-confirmation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id }),
      })
      const confirmData = await confirmResp.json()
      confirmationEmailSent = !!confirmData.success
    } catch (_e) {
      // Swallow: booking succeeded, email is best-effort. Failure is logged in function logs.
    }
  }

  return new Response(
    JSON.stringify({ event_id: event.id, success: true, confirmation_email_sent: confirmationEmailSent }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
})
