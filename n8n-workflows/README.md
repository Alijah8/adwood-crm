# n8n Workflow Templates

These workflow templates are designed to integrate with your Adwood CRM. Import them into your n8n instance and configure the credentials.

## Workflows Included

### 1. Meta Lead Ads → CRM + Email (`01-meta-lead-capture.json`)
**Trigger**: Webhook receives lead from Meta Lead Ads
**Actions**:
- Parse lead data from Meta's format
- Send welcome email to the lead
- Notify your team about the new lead

**Setup**:
1. Import into n8n
2. Configure Gmail credentials
3. Copy the webhook URL
4. Add webhook URL to Meta Lead Ads in Business Manager

### 2. Email Nurture Sequence (`02-email-nurture-sequence.json`)
**Trigger**: Webhook (call from other workflows or manually)
**Actions**:
- Day 0: Send follow-up question email
- Day 2: Send services overview with CTA
- Day 5: Send final follow-up with urgency

**Setup**:
1. Import into n8n
2. Configure Gmail credentials
3. Update email content and calendar link
4. Trigger from other workflows when new leads arrive

### 3. Booking Confirmation (`03-booking-confirmation.json`)
**Trigger**: Webhook receives booking form submission
**Actions**:
- Create Google Calendar event
- Send confirmation email to client
- Auto-invite attendees

**Setup**:
1. Import into n8n
2. Configure Gmail and Google Calendar credentials
3. Connect your landing page booking form to the webhook

### 4. Daily Appointment Reminders (`04-appointment-reminders.json`)
**Trigger**: Scheduled daily at 8 AM
**Actions**:
- Fetch today's calendar events
- Filter events with attendees
- Send reminder emails

**Setup**:
1. Import into n8n
2. Configure Gmail and Google Calendar credentials
3. Activate the workflow

---

## Configuration Required

### Gmail OAuth2 Credentials
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add to n8n Credentials
4. Grant Gmail send permissions

### Google Calendar Credentials
1. Use same Google Cloud project
2. Enable Google Calendar API
3. Add to n8n Credentials

### Environment Variables
Set these in your n8n instance:
- `GMAIL_FROM_EMAIL`: Your sending email address
- `NOTIFY_EMAIL`: Email for team notifications

---

## Importing Workflows

1. Open n8n
2. Click "Add workflow" → "Import from File"
3. Select the JSON file
4. Configure credentials in each node
5. Test with a test execution
6. Activate when ready

---

## Webhook URLs

After importing, your webhook URLs will be:
- Meta Leads: `https://your-n8n-url/webhook/meta-leads`
- Nurture Start: `https://your-n8n-url/webhook/start-nurture`
- Booking: `https://your-n8n-url/webhook/booking`

Replace `your-n8n-url` with your actual n8n instance URL.

---

## Tips

- Test each workflow manually before connecting to production
- Use n8n's execution history to debug issues
- Set up error notifications for critical workflows
- Consider adding error handling nodes for production use
