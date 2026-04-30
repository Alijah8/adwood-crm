import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const { session_id } = await req.json()

  // Retrieve Stripe Checkout Session
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    },
  })
  const session = await res.json()

  if (session.error || session.payment_status !== "paid") {
    return new Response(
      JSON.stringify({ paid: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  return new Response(
    JSON.stringify({
      paid: true,
      clientName: session.customer_details?.name || "",
      clientEmail: session.customer_details?.email || "",
      paymentDate: session.created
        ? new Date(session.created * 1000).toISOString()
        : new Date().toISOString(),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  )
})
