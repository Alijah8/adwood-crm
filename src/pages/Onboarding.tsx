import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { verifyStripeSession } from '../lib/stripe'
import { BookingStep } from '../components/onboarding/BookingStep'
import { BookedMeetingsSidebar } from '../components/onboarding/BookedMeetingsSidebar'
import { ConfirmationPage } from '../components/onboarding/ConfirmationPage'

interface Meeting {
  step: number
  type: string
  datetime: string
  gcal_event_id: string
}

const MEETINGS = [
  { step: 1, type: 'Cash Flow Tracking Call', description: 'Review your current cash flow and spending patterns to build your financial blueprint.' },
  { step: 2, type: 'Application Call', description: 'Complete your IUL policy application together.' },
  { step: 3, type: 'Medical Exam Call', description: 'Walk through the medical exam process and scheduling.' },
  { step: 4, type: 'Requirements Call', description: 'Review initial underwriting requirements and next steps.' },
  { step: 5, type: '2nd Requirements Call', description: 'Follow up on any outstanding underwriting items.' },
  { step: 6, type: 'Budget Check-In Call', description: 'Confirm your premium budget and policy funding strategy.' },
  { step: 7, type: 'Final Policy Receipt Call', description: 'Review and receive your approved policy documents.' },
  { step: 8, type: 'Loan Walkthrough Call', description: 'Understand your policy loan options and how to access them.' },
  { step: 9, type: 'Final Onboarding Call', description: 'Wrap up onboarding and set you up for long-term success.' },
]

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000)
}

function getDateRange(step: number, bookedMeetings: Meeting[], paymentDate: Date): { start: string; end: string } {
  const twoWeeksOut = (from: Date) => addDays(from, 14)

  switch (step) {
    case 1: {
      const start = addDays(paymentDate, 1)
      return { start: start.toISOString(), end: twoWeeksOut(start).toISOString() }
    }
    case 2: {
      const prev = new Date(bookedMeetings.find(m => m.step === 1)!.datetime)
      return { start: prev.toISOString(), end: twoWeeksOut(prev).toISOString() }
    }
    case 3: {
      const prev = new Date(bookedMeetings.find(m => m.step === 2)!.datetime)
      return { start: prev.toISOString(), end: twoWeeksOut(prev).toISOString() }
    }
    case 4: {
      const prev = new Date(bookedMeetings.find(m => m.step === 3)!.datetime)
      const start = addDays(prev, 3)
      return { start: start.toISOString(), end: twoWeeksOut(start).toISOString() }
    }
    case 5: {
      const prev = new Date(bookedMeetings.find(m => m.step === 4)!.datetime)
      const start = addDays(prev, 5)
      return { start: start.toISOString(), end: twoWeeksOut(start).toISOString() }
    }
    case 6: {
      const start = addDays(paymentDate, 25)
      return { start: start.toISOString(), end: twoWeeksOut(start).toISOString() }
    }
    case 7: {
      const start = addDays(paymentDate, 20)
      return { start: start.toISOString(), end: twoWeeksOut(start).toISOString() }
    }
    case 8: {
      const prev = new Date(bookedMeetings.find(m => m.step === 7)!.datetime)
      const start = addDays(prev, 18)
      return { start: start.toISOString(), end: twoWeeksOut(start).toISOString() }
    }
    case 9: {
      const prev = new Date(bookedMeetings.find(m => m.step === 8)!.datetime)
      return { start: prev.toISOString(), end: twoWeeksOut(prev).toISOString() }
    }
    default: {
      return { start: new Date().toISOString(), end: twoWeeksOut(new Date()).toISOString() }
    }
  }
}

export function Onboarding() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [bookedMeetings, setBookedMeetings] = useState<Meeting[]>([])
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    if (!sessionId) {
      setError('No booking session found.')
      setLoading(false)
      return
    }
    initSession()
  }, [sessionId])

  async function initSession() {
    // Check for existing session in Supabase (resume support)
    const { data: existing } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single()

    if (existing) {
      setClientName(existing.client_name)
      setClientEmail(existing.client_email)
      setPaymentDate(new Date(existing.payment_date))
      const meetings = existing.meetings || []
      setBookedMeetings(meetings)
      setCurrentStep(meetings.length + 1)
      setLoading(false)
      return
    }

    // Verify Stripe payment
    const verification = await verifyStripeSession(sessionId!)
    if (!verification || !verification.paid) {
      setError('Payment not verified. Please complete your deposit first.')
      setLoading(false)
      return
    }

    setClientName(verification.clientName)
    setClientEmail(verification.clientEmail)
    setPaymentDate(new Date(verification.paymentDate))

    // Create onboarding session row
    await supabase.from('onboarding_sessions').insert({
      stripe_session_id: sessionId,
      client_name: verification.clientName,
      client_email: verification.clientEmail,
      payment_date: verification.paymentDate,
    })

    setLoading(false)
  }

  function handleBooked(meeting: Meeting) {
    const updated = [...bookedMeetings, meeting]
    setBookedMeetings(updated)
    setCurrentStep(meeting.step + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Setting up your onboarding...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 max-w-md">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
            <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-lg font-medium">{error}</p>
        </div>
      </div>
    )
  }

  // All 9 booked — show confirmation
  if (currentStep > 9) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <ConfirmationPage clientName={clientName} meetings={bookedMeetings} />
      </div>
    )
  }

  const currentMeeting = MEETINGS[currentStep - 1]
  const dateRange = getDateRange(currentStep, bookedMeetings, paymentDate)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">AD Wood Consulting</h1>
            <p className="text-sm text-muted-foreground">Onboarding for {clientName}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of 9
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 9) * 100}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-8">
            <BookedMeetingsSidebar
              bookedMeetings={bookedMeetings}
              currentStep={currentStep}
            />
          </div>
        </div>

        {/* Booking step */}
        <div className="flex-1 max-w-2xl">
          <BookingStep
            key={currentStep}
            step={currentStep}
            meetingType={currentMeeting.type}
            description={currentMeeting.description}
            startDate={dateRange.start}
            endDate={dateRange.end}
            sessionId={sessionId!}
            clientName={clientName}
            clientEmail={clientEmail}
            onBooked={handleBooked}
          />
        </div>
      </div>
    </div>
  )
}
