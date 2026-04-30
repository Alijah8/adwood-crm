import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!
const GOOGLE_REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN")!
const CALENDAR_ID = Deno.env.get("GOOGLE_CALENDAR_ID") || "primary"

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

// Central Time offset: CST = UTC-6, CDT = UTC-5
// Determine if a date is in CDT (second Sunday of March to first Sunday of November)
function getCentralOffset(date: Date): number {
  const year = date.getUTCFullYear()
  // Second Sunday of March
  const marchFirst = new Date(Date.UTC(year, 2, 1))
  const marchSecondSunday = new Date(Date.UTC(year, 2, 8 + (7 - marchFirst.getUTCDay()) % 7))
  // First Sunday of November
  const novFirst = new Date(Date.UTC(year, 10, 1))
  const novFirstSunday = new Date(Date.UTC(year, 10, 1 + (7 - novFirst.getUTCDay()) % 7))

  if (date >= marchSecondSunday && date < novFirstSunday) {
    return 5 // CDT: UTC-5
  }
  return 6 // CST: UTC-6
}

function generateSlots(startDate: string, endDate: string): string[] {
  const slots: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Iterate day by day
  const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))

  while (current <= endDay) {
    const offset = getCentralOffset(current)
    const dayOfWeek = current.getUTCDay() // 0=Sun

    // Monday (1) through Saturday (6)
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      // 7:00 AM to 6:30 PM CT (last 30-min slot starts at 6:30 PM, ends at 7:00 PM)
      for (let hour = 7; hour <= 18; hour++) {
        for (let min = 0; min < 60; min += 30) {
          if (hour === 18 && min === 30) break // Stop at 6:30 PM
          // Convert CT hour to UTC
          const utcHour = hour + offset
          const slotStart = new Date(Date.UTC(
            current.getUTCFullYear(),
            current.getUTCMonth(),
            current.getUTCDate(),
            utcHour,
            min,
            0
          ))
          // Skip slots in the past
          if (slotStart > new Date()) {
            slots.push(slotStart.toISOString())
          }
        }
      }
    }
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return slots
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const { start_date, end_date } = await req.json()
  const accessToken = await getAccessToken()

  // Get busy times from Google Calendar
  const busyRes = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: start_date,
      timeMax: end_date,
      items: [{ id: CALENDAR_ID }],
    }),
  })
  const busyData = await busyRes.json()
  const busyPeriods = busyData.calendars?.[CALENDAR_ID]?.busy || []

  // Generate all valid slots
  const allSlots = generateSlots(start_date, end_date)

  // Filter out slots that overlap with busy periods
  const availableSlots = allSlots.filter((slotIso) => {
    const slotStart = new Date(slotIso)
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000)
    return !busyPeriods.some((busy: { start: string; end: string }) => {
      const busyStart = new Date(busy.start)
      const busyEnd = new Date(busy.end)
      return slotStart < busyEnd && slotEnd > busyStart
    })
  })

  return new Response(
    JSON.stringify({ slots: availableSlots }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
})
