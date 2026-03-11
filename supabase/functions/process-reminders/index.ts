import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- Email Templates ----------

interface Template {
  subject: string;
  body: string;
}

const TEMPLATES: Record<string, Template> = {
  booking_confirm_email: {
    subject: "You're confirmed! Your IUL consultation is booked",
    body: `Hi {{contact_first_name}},

Thank you for booking your IUL consultation! Here are your appointment details:

Date: {{appointment_date}}
Time: {{appointment_time}} (Central Time)
{{meet_link_section}}
Before our meeting, I'd love for you to take a look at this cash flow analysis sheet so we can make the most of our time together:
{{cash_flow_sheet_url}}

Just fill in your basic financial info and bring any questions you have. This will help me tailor our conversation to your specific situation.

If you need to reschedule or cancel, simply reply to this email and I'll get you taken care of.

Looking forward to connecting with you!

Best,
Alijah Wood
AD Wood Consulting
alijah@adwoodconsulting.com`,
  },

  booking_staff_notify_email: {
    subject: "New meeting booked: {{contact_name}}",
    body: `Hey {{staff_name}},

A new consultation has been booked!

Contact: {{contact_name}}
Email: {{contact_email}}
Phone: {{contact_phone}}
Date: {{appointment_date}} at {{appointment_time}} (CT)
{{meet_link_section}}
Deal has been auto-created in the CRM. Go prep!`,
  },

  reminder_48h_email: {
    subject: "Your consultation is in 2 days!",
    body: `Hi {{contact_first_name}},

Just a friendly reminder that your IUL consultation is coming up in 2 days!

Date: {{appointment_date}}
Time: {{appointment_time}} (Central Time)
{{meet_link_section}}
If you haven't already, please take a few minutes to fill out the cash flow analysis sheet before our meeting:
{{cash_flow_sheet_url}}

This will help us hit the ground running and make the most of our time together.

If you need to reschedule, just reply to this email.

See you soon!

Best,
Alijah Wood
AD Wood Consulting`,
  },

  reminder_24h_email: {
    subject: "Tomorrow: Your IUL consultation with Alijah",
    body: `Hi {{contact_first_name}},

Your consultation is tomorrow! Here's a quick refresher on the details:

Date: {{appointment_date}}
Time: {{appointment_time}} (Central Time)
{{meet_link_section}}
A few things to have ready:
- Any questions about your current financial plan
- Your completed cash flow sheet (if you haven't done it yet, here's the link: {{cash_flow_sheet_url}})
- An open mind for what's possible with the right strategy

If something came up and you need to reschedule, reply to this email and we'll work it out.

See you tomorrow!

Best,
Alijah Wood
AD Wood Consulting`,
  },

  reminder_6h_email: {
    subject: "In a few hours: Your consultation with Alijah",
    body: `Hi {{contact_first_name}},

Your IUL consultation is just a few hours away!

Time: {{appointment_time}} (Central Time)
{{meet_link_section}}
I'm looking forward to showing you how you can reach financial freedom faster, safer, and tax-free.

See you soon!

Best,
Alijah Wood
AD Wood Consulting`,
  },

  reminder_1h_email: {
    subject: "Starting soon: Your consultation in 1 hour",
    body: `Hi {{contact_first_name}},

We're almost there! Your consultation starts in about an hour.

Time: {{appointment_time}} (Central Time)
{{meet_link_section}}
See you very soon!

Alijah Wood
AD Wood Consulting`,
  },

  reminder_1h_staff_email: {
    subject: "1 hour: Meeting with {{contact_name}}",
    body: `Hey {{staff_name}}, your meeting with {{contact_first_name}} is in one hour.

Contact: {{contact_name}} ({{contact_email}})
Time: {{appointment_time}} (CT)
{{meet_link_section}}
Send them a personal message!`,
  },
};

// ---------- Template rendering ----------

function renderTemplate(templateKey: string, vars: Record<string, string>): { subject: string; body: string } | null {
  const tmpl = TEMPLATES[templateKey];
  if (!tmpl) return null;

  const meetLink = vars.meet_link || "";
  const meetLinkSection = meetLink
    ? `Meeting Link: ${meetLink}\n`
    : "";

  const allVars: Record<string, string> = { ...vars, meet_link_section: meetLinkSection };

  let subject = tmpl.subject;
  let body = tmpl.body;
  for (const [key, value] of Object.entries(allVars)) {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    subject = subject.replace(re, value);
    body = body.replace(re, value);
  }
  return { subject, body };
}

// ---------- Gmail send via OAuth ----------

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await resp.json();
  if (data.error) throw new Error(`Gmail token refresh failed: ${data.error} - ${data.error_description || ""}`);
  return data.access_token;
}

function buildRawEmail(from: string, to: string, subject: string, body: string): string {
  const boundary = "boundary_" + crypto.randomUUID().replace(/-/g, "");
  const raw = [
    `From: Alijah Wood <${from}>`,
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
    ...body.split("\n").map((line) => (line.trim() === "" ? "<br>" : `<p style="margin: 0 0 8px 0;">${line}</p>`)),
    `</div>`,
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  // Base64url encode
  const encoded = btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return encoded;
}

async function sendEmail(accessToken: string, from: string, to: string, subject: string, body: string): Promise<{ id: string }> {
  const raw = buildRawEmail(from, to, subject, body);
  const resp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gmail send failed (${resp.status}): ${err}`);
  }
  return resp.json();
}

// ---------- Telegram alert ----------

async function sendTelegramAlert(botToken: string, chatId: string, message: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  });
}

// ---------- Main handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const gmailClientId = Deno.env.get("GMAIL_CLIENT_ID")!;
    const gmailClientSecret = Deno.env.get("GMAIL_CLIENT_SECRET")!;
    const gmailRefreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN")!;
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
    const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID") || "";
    const fromEmail = "alijah@adwoodconsulting.com";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch due reminders
    const { data: reminders, error: fetchErr } = await supabase
      .from("scheduled_reminders")
      .select("*")
      .eq("status", "pending")
      .lte("send_at", new Date().toISOString())
      .order("send_at", { ascending: true })
      .limit(20);

    if (fetchErr) throw new Error(`Fetch reminders failed: ${fetchErr.message}`);
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ processed: 0, sent: 0, failed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get Gmail access token (once per batch)
    let accessToken: string;
    try {
      accessToken = await getAccessToken(gmailClientId, gmailClientSecret, gmailRefreshToken);
    } catch (err) {
      // Token refresh failure — alert Alijah and stop
      const msg = `Process-reminders: Gmail token refresh failed.\n\nError: ${(err as Error).message}\n\nReminders are not being sent. Fix the OAuth credentials.`;
      if (telegramBotToken && telegramChatId) {
        await sendTelegramAlert(telegramBotToken, telegramChatId, msg);
      }
      return new Response(JSON.stringify({ error: "Gmail token refresh failed", detail: (err as Error).message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Process each reminder
    let sent = 0;
    let failed = 0;

    for (const reminder of reminders) {
      const vars = (reminder.template_vars || {}) as Record<string, string>;
      const rendered = renderTemplate(reminder.template_key, vars);

      if (!rendered) {
        await supabase
          .from("scheduled_reminders")
          .update({ status: "failed", error_message: `Unknown template: ${reminder.template_key}` })
          .eq("id", reminder.id);
        failed++;
        continue;
      }

      const recipientEmail = reminder.recipient_email;
      if (!recipientEmail) {
        await supabase
          .from("scheduled_reminders")
          .update({ status: "skipped", error_message: "No recipient email" })
          .eq("id", reminder.id);
        continue;
      }

      try {
        await sendEmail(accessToken, fromEmail, recipientEmail, rendered.subject, rendered.body);

        // Log to communications table
        const commId = crypto.randomUUID();
        if (reminder.contact_id) {
          await supabase.from("communications").insert({
            id: commId,
            type: "email",
            direction: "outbound",
            contact_id: reminder.contact_id,
            subject: rendered.subject,
            body: rendered.body,
            status: "sent",
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        }

        // Mark reminder as sent
        await supabase
          .from("scheduled_reminders")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            communication_id: reminder.contact_id ? commId : null,
          })
          .eq("id", reminder.id);

        sent++;
      } catch (err) {
        const errorMsg = (err as Error).message;
        await supabase
          .from("scheduled_reminders")
          .update({ status: "failed", error_message: errorMsg })
          .eq("id", reminder.id);
        failed++;

        // Alert on Gmail failures
        if (errorMsg.includes("401") || errorMsg.includes("403")) {
          if (telegramBotToken && telegramChatId) {
            await sendTelegramAlert(
              telegramBotToken,
              telegramChatId,
              `Process-reminders: Gmail send error for ${reminder.template_key}.\n\nError: ${errorMsg}`
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ processed: reminders.length, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
