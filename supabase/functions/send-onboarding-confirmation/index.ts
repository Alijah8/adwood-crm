import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID")!
const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET")!
const GMAIL_REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const FROM_ADDRESS = "growth@adwoodconsulting.us"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type Meeting = {
  step: number
  type: string
  datetime: string
}

async function getAccessToken(): Promise<string> {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  })
  const data = await resp.json()
  if (data.error) throw new Error(`Gmail token refresh failed: ${data.error}`)
  return data.access_token
}

function formatMeetingLine(m: Meeting): string {
  const d = new Date(m.datetime)
  const date = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  })
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  })
  return `Step ${m.step}. ${m.type}\n${date} at ${time}`
}

function buildEmailBody(clientName: string, meetings: Meeting[]): string {
  const sorted = [...meetings].sort((a, b) => a.step - b.step)
  const firstName = clientName.split(" ")[0] || clientName
  const lines: string[] = []
  lines.push(`${firstName},`)
  lines.push("")
  lines.push("All nine onboarding meetings are on the calendar. You should have a calendar invite for each one in your inbox already.")
  lines.push("")
  lines.push("Here is the full schedule for your records:")
  lines.push("")
  for (const m of sorted) {
    lines.push(formatMeetingLine(m))
    lines.push("")
  }
  lines.push("If anything needs to move, reply to this email and we will reschedule.")
  lines.push("")
  lines.push("Talk soon,")
  lines.push("Alijah Wood")
  lines.push("AD Wood Consulting")
  return lines.join("\n")
}

function buildRawEmail(to: string, subject: string, body: string): string {
  const boundary = "boundary_" + crypto.randomUUID().replace(/-/g, "")
  const parts: string[] = [
    `From: Alijah Wood <${FROM_ADDRESS}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    body,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">`,
  ]
  for (const line of body.split("\n")) {
    parts.push(line.trim() === "" ? "<br>" : `<p style="margin: 0 0 8px 0;">${line}</p>`)
  }
  parts.push(`</div>`)
  parts.push(``)
  parts.push(`--${boundary}--`)

  const raw = parts.join("\r\n")
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { session_id } = await req.json()
    if (!session_id) {
      return new Response(
        JSON.stringify({ success: false, error: "session_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: session, error } = await supabase
      .from("onboarding_sessions")
      .select("client_name, client_email, meetings")
      .eq("stripe_session_id", session_id)
      .single()

    if (error || !session) {
      return new Response(
        JSON.stringify({ success: false, error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const meetings = (session.meetings || []) as Meeting[]
    if (meetings.length !== 9) {
      return new Response(
        JSON.stringify({ success: false, error: `Expected 9 meetings, found ${meetings.length}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const accessToken = await getAccessToken()
    const subject = "Your AD Wood Consulting onboarding schedule"
    const body = buildEmailBody(session.client_name, meetings)
    const raw = buildRawEmail(session.client_email, subject, body)

    const sendResp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    })

    if (!sendResp.ok) {
      const errText = await sendResp.text()
      return new Response(
        JSON.stringify({ success: false, error: `Gmail send failed: ${sendResp.status} ${errText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const sent = await sendResp.json()
    return new Response(
      JSON.stringify({ success: true, gmail_message_id: sent.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
