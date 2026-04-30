const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export async function verifyStripeSession(sessionId: string): Promise<{
  paid: boolean
  clientName: string
  clientEmail: string
  paymentDate: string
} | null> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-stripe-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  })
  if (!res.ok) return null
  return res.json()
}
