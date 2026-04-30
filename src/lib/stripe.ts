const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function verifyStripeSession(sessionId: string): Promise<{
  paid: boolean
  clientName: string
  clientEmail: string
  paymentDate: string
} | null> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-stripe-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ session_id: sessionId }),
  })
  if (!res.ok) return null
  return res.json()
}
