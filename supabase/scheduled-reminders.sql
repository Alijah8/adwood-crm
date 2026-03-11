-- ============================================================
-- Booked Meeting Reminder Sequence
-- Table: scheduled_reminders + 3 trigger functions
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  deal_id TEXT,
  send_at TIMESTAMPTZ NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  recipient_type TEXT NOT NULL DEFAULT 'contact',
  recipient_email TEXT,
  recipient_name TEXT,
  template_key TEXT NOT NULL,
  template_vars JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  communication_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for the edge function query (due pending reminders)
CREATE INDEX IF NOT EXISTS idx_reminders_due
  ON scheduled_reminders(send_at)
  WHERE status = 'pending';

-- Index for looking up reminders by event
CREATE INDEX IF NOT EXISTS idx_reminders_event_id
  ON scheduled_reminders(event_id);

-- RLS
ALTER TABLE scheduled_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reminders"
  ON scheduled_reminders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert reminders"
  ON scheduled_reminders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reminders"
  ON scheduled_reminders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role bypasses RLS automatically (used by edge function)


-- ============================================================
-- 2. Trigger function: AFTER INSERT on calendar_events
-- ============================================================
CREATE OR REPLACE FUNCTION handle_meeting_created()
RETURNS TRIGGER AS $$
DECLARE
  v_contact RECORD;
  v_deal_id TEXT;
  v_contact_name TEXT;
  v_template_vars JSONB;
  v_staff_email TEXT := 'alijah@adwoodconsulting.com';
  v_staff_name TEXT := 'Alijah';
  v_meet_link TEXT;
BEGIN
  -- Guard: only meetings with a linked contact
  IF NEW.type != 'meeting' OR NEW.contact_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up contact
  SELECT first_name, last_name, email, phone
    INTO v_contact
    FROM contacts
    WHERE id = NEW.contact_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_contact_name := COALESCE(v_contact.first_name, '') || ' ' || COALESCE(v_contact.last_name, '');
  v_contact_name := TRIM(v_contact_name);

  -- Create a deal
  v_deal_id := gen_random_uuid()::text;
  INSERT INTO deals (id, title, value, stage, contact_id, probability, created_at, updated_at)
  VALUES (
    v_deal_id,
    'IUL Consultation — ' || v_contact_name,
    0,
    'lead',
    NEW.contact_id,
    10,
    NOW(),
    NOW()
  );

  -- Link deal back to event
  UPDATE calendar_events SET deal_id = v_deal_id WHERE id = NEW.id;

  -- Build template vars
  v_meet_link := COALESCE(NEW.video_link, '');
  v_template_vars := jsonb_build_object(
    'contact_first_name', COALESCE(v_contact.first_name, ''),
    'contact_last_name', COALESCE(v_contact.last_name, ''),
    'contact_name', v_contact_name,
    'contact_email', COALESCE(v_contact.email, ''),
    'contact_phone', COALESCE(v_contact.phone, ''),
    'appointment_date', TO_CHAR(NEW.start_time AT TIME ZONE 'America/Chicago', 'FMMonth FMDDth, YYYY'),
    'appointment_time', TO_CHAR(NEW.start_time AT TIME ZONE 'America/Chicago', 'FMHH12:MI AM'),
    'appointment_day', TO_CHAR(NEW.start_time AT TIME ZONE 'America/Chicago', 'FMDay'),
    'meet_link', v_meet_link,
    'cash_flow_sheet_url', 'https://docs.google.com/spreadsheets/d/1H8juh_xMpoO4wNnhBJHW_m2vIE4vRx1A_c5Mt2Y2RWM/copy',
    'staff_name', v_staff_name,
    'event_title', COALESCE(NEW.title, 'IUL Consultation')
  );

  -- Insert 13 reminder rows
  -- #1: Immediate — booking confirmation email to contact
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NOW(), 'email', 'contact', v_contact.email, v_contact_name, 'booking_confirm_email', v_template_vars,
    CASE WHEN v_contact.email IS NULL OR v_contact.email = '' THEN 'skipped' ELSE 'pending' END);

  -- #2: Immediate — booking confirmation SMS to contact (skipped until Twilio)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NOW(), 'sms', 'contact', v_contact.email, v_contact_name, 'booking_confirm_sms', v_template_vars, 'skipped');

  -- #3: Immediate — staff notification email
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NOW(), 'email', 'staff', v_staff_email, v_staff_name, 'booking_staff_notify_email', v_template_vars, 'pending');

  -- #4: Immediate — staff notification SMS (skipped until Twilio)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NOW(), 'sms', 'staff', v_staff_email, v_staff_name, 'booking_staff_notify_sms', v_template_vars, 'skipped');

  -- #5: 48h before — reminder email to contact
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '48 hours', 'email', 'contact', v_contact.email, v_contact_name, 'reminder_48h_email', v_template_vars,
    CASE WHEN v_contact.email IS NULL OR v_contact.email = '' THEN 'skipped'
         WHEN NEW.start_time - INTERVAL '48 hours' <= NOW() THEN 'skipped'
         ELSE 'pending' END);

  -- #6: 48h before — reminder SMS to contact (skipped)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '48 hours', 'sms', 'contact', v_contact.email, v_contact_name, 'reminder_48h_sms', v_template_vars, 'skipped');

  -- #7: 24h before — reminder email to contact
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '24 hours', 'email', 'contact', v_contact.email, v_contact_name, 'reminder_24h_email', v_template_vars,
    CASE WHEN v_contact.email IS NULL OR v_contact.email = '' THEN 'skipped'
         WHEN NEW.start_time - INTERVAL '24 hours' <= NOW() THEN 'skipped'
         ELSE 'pending' END);

  -- #8: 24h before — reminder SMS to contact (skipped)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '24 hours', 'sms', 'contact', v_contact.email, v_contact_name, 'reminder_24h_sms', v_template_vars, 'skipped');

  -- #9: 6h before — reminder email to contact
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '6 hours', 'email', 'contact', v_contact.email, v_contact_name, 'reminder_6h_email', v_template_vars,
    CASE WHEN v_contact.email IS NULL OR v_contact.email = '' THEN 'skipped'
         WHEN NEW.start_time - INTERVAL '6 hours' <= NOW() THEN 'skipped'
         ELSE 'pending' END);

  -- #10: 6h before — reminder SMS to contact (skipped)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '6 hours', 'sms', 'contact', v_contact.email, v_contact_name, 'reminder_6h_sms', v_template_vars, 'skipped');

  -- #11: 1h before — reminder email to contact
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '1 hour', 'email', 'contact', v_contact.email, v_contact_name, 'reminder_1h_email', v_template_vars,
    CASE WHEN v_contact.email IS NULL OR v_contact.email = '' THEN 'skipped'
         WHEN NEW.start_time - INTERVAL '1 hour' <= NOW() THEN 'skipped'
         ELSE 'pending' END);

  -- #12: 1h before — reminder SMS to contact (skipped)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '1 hour', 'sms', 'contact', v_contact.email, v_contact_name, 'reminder_1h_sms', v_template_vars, 'skipped');

  -- #13: 1h before — staff reminder email
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '1 hour', 'email', 'staff', v_staff_email, v_staff_name, 'reminder_1h_staff_email', v_template_vars,
    CASE WHEN NEW.start_time - INTERVAL '1 hour' <= NOW() THEN 'skipped' ELSE 'pending' END);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 3. Trigger function: AFTER UPDATE on calendar_events (reschedule)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_meeting_updated()
RETURNS TRIGGER AS $$
DECLARE
  v_contact RECORD;
  v_contact_name TEXT;
  v_template_vars JSONB;
  v_staff_email TEXT := 'alijah@adwoodconsulting.com';
  v_staff_name TEXT := 'Alijah';
  v_meet_link TEXT;
  v_deal_id TEXT;
BEGIN
  -- Guard: only fire if start_time changed on a meeting type
  IF NEW.type != 'meeting' OR OLD.start_time = NEW.start_time THEN
    RETURN NEW;
  END IF;

  -- Cancel all pending reminders for this event
  UPDATE scheduled_reminders
    SET status = 'cancelled'
    WHERE event_id = NEW.id AND status = 'pending';

  -- Only regenerate if contact still linked
  IF NEW.contact_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up contact
  SELECT first_name, last_name, email, phone
    INTO v_contact
    FROM contacts
    WHERE id = NEW.contact_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_contact_name := TRIM(COALESCE(v_contact.first_name, '') || ' ' || COALESCE(v_contact.last_name, ''));
  v_deal_id := NEW.deal_id;
  v_meet_link := COALESCE(NEW.video_link, '');

  v_template_vars := jsonb_build_object(
    'contact_first_name', COALESCE(v_contact.first_name, ''),
    'contact_last_name', COALESCE(v_contact.last_name, ''),
    'contact_name', v_contact_name,
    'contact_email', COALESCE(v_contact.email, ''),
    'contact_phone', COALESCE(v_contact.phone, ''),
    'appointment_date', TO_CHAR(NEW.start_time AT TIME ZONE 'America/Chicago', 'FMMonth FMDDth, YYYY'),
    'appointment_time', TO_CHAR(NEW.start_time AT TIME ZONE 'America/Chicago', 'FMHH12:MI AM'),
    'appointment_day', TO_CHAR(NEW.start_time AT TIME ZONE 'America/Chicago', 'FMDay'),
    'meet_link', v_meet_link,
    'cash_flow_sheet_url', 'https://docs.google.com/spreadsheets/d/1H8juh_xMpoO4wNnhBJHW_m2vIE4vRx1A_c5Mt2Y2RWM/copy',
    'staff_name', v_staff_name,
    'event_title', COALESCE(NEW.title, 'IUL Consultation')
  );

  -- Regenerate all 13 reminders (same logic as insert trigger)
  -- #1: Immediate — rescheduled confirmation email
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NOW(), 'email', 'contact', v_contact.email, v_contact_name, 'booking_confirm_email', v_template_vars,
    CASE WHEN v_contact.email IS NULL OR v_contact.email = '' THEN 'skipped' ELSE 'pending' END);

  -- #2: SMS (skipped)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NOW(), 'sms', 'contact', v_contact.email, v_contact_name, 'booking_confirm_sms', v_template_vars, 'skipped');

  -- #3: Staff notification
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NOW(), 'email', 'staff', v_staff_email, v_staff_name, 'booking_staff_notify_email', v_template_vars, 'pending');

  -- #4: Staff SMS (skipped)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NOW(), 'sms', 'staff', v_staff_email, v_staff_name, 'booking_staff_notify_sms', v_template_vars, 'skipped');

  -- #5: 48h email
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '48 hours', 'email', 'contact', v_contact.email, v_contact_name, 'reminder_48h_email', v_template_vars,
    CASE WHEN v_contact.email IS NULL OR v_contact.email = '' THEN 'skipped'
         WHEN NEW.start_time - INTERVAL '48 hours' <= NOW() THEN 'skipped' ELSE 'pending' END);

  -- #6: 48h SMS (skipped)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '48 hours', 'sms', 'contact', v_contact.email, v_contact_name, 'reminder_48h_sms', v_template_vars, 'skipped');

  -- #7: 24h email
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '24 hours', 'email', 'contact', v_contact.email, v_contact_name, 'reminder_24h_email', v_template_vars,
    CASE WHEN v_contact.email IS NULL OR v_contact.email = '' THEN 'skipped'
         WHEN NEW.start_time - INTERVAL '24 hours' <= NOW() THEN 'skipped' ELSE 'pending' END);

  -- #8: 24h SMS (skipped)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '24 hours', 'sms', 'contact', v_contact.email, v_contact_name, 'reminder_24h_sms', v_template_vars, 'skipped');

  -- #9: 6h email
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '6 hours', 'email', 'contact', v_contact.email, v_contact_name, 'reminder_6h_email', v_template_vars,
    CASE WHEN v_contact.email IS NULL OR v_contact.email = '' THEN 'skipped'
         WHEN NEW.start_time - INTERVAL '6 hours' <= NOW() THEN 'skipped' ELSE 'pending' END);

  -- #10: 6h SMS (skipped)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '6 hours', 'sms', 'contact', v_contact.email, v_contact_name, 'reminder_6h_sms', v_template_vars, 'skipped');

  -- #11: 1h email
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '1 hour', 'email', 'contact', v_contact.email, v_contact_name, 'reminder_1h_email', v_template_vars,
    CASE WHEN v_contact.email IS NULL OR v_contact.email = '' THEN 'skipped'
         WHEN NEW.start_time - INTERVAL '1 hour' <= NOW() THEN 'skipped' ELSE 'pending' END);

  -- #12: 1h SMS (skipped)
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '1 hour', 'sms', 'contact', v_contact.email, v_contact_name, 'reminder_1h_sms', v_template_vars, 'skipped');

  -- #13: 1h staff email
  INSERT INTO scheduled_reminders (event_id, contact_id, deal_id, send_at, channel, recipient_type, recipient_email, recipient_name, template_key, template_vars, status)
  VALUES (NEW.id, NEW.contact_id, v_deal_id, NEW.start_time - INTERVAL '1 hour', 'email', 'staff', v_staff_email, v_staff_name, 'reminder_1h_staff_email', v_template_vars,
    CASE WHEN NEW.start_time - INTERVAL '1 hour' <= NOW() THEN 'skipped' ELSE 'pending' END);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 4. Trigger function: AFTER UPDATE on calendar_events (soft delete)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_meeting_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Guard: only fire when deleted_at is set for the first time
  IF OLD.deleted_at IS NOT NULL OR NEW.deleted_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Cancel all pending reminders
  UPDATE scheduled_reminders
    SET status = 'cancelled'
    WHERE event_id = NEW.id AND status = 'pending';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 5. Create triggers
-- ============================================================
DROP TRIGGER IF EXISTS trg_meeting_created ON calendar_events;
CREATE TRIGGER trg_meeting_created
  AFTER INSERT ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_meeting_created();

DROP TRIGGER IF EXISTS trg_meeting_updated ON calendar_events;
CREATE TRIGGER trg_meeting_updated
  AFTER UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_meeting_updated();

DROP TRIGGER IF EXISTS trg_meeting_deleted ON calendar_events;
CREATE TRIGGER trg_meeting_deleted
  AFTER UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_meeting_deleted();
