CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id text REFERENCES contacts(id),
  stripe_session_id text UNIQUE NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  payment_date timestamptz NOT NULL DEFAULT now(),
  meetings jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anon key to insert and update (public booking wizard needs this)
CREATE POLICY "Anon can manage onboarding sessions"
  ON onboarding_sessions FOR ALL
  USING (true)
  WITH CHECK (true);
