import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { TimeSlotPicker } from './TimeSlotPicker'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

interface BookingStepProps {
  step: number
  meetingType: string
  description: string
  startDate: string
  endDate: string
  sessionId: string
  clientName: string
  clientEmail: string
  onBooked: (meeting: { step: number; type: string; datetime: string; gcal_event_id: string }) => void
}

export function BookingStep({
  step,
  meetingType,
  description,
  startDate,
  endDate,
  sessionId,
  clientName,
  clientEmail,
  onBooked,
}: BookingStepProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)

  async function handleBook() {
    if (!selectedSlot) return
    setBooking(true)

    const res = await fetch(`${SUPABASE_URL}/functions/v1/book-meeting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meeting_type: meetingType,
        datetime: selectedSlot,
        client_name: clientName,
        client_email: clientEmail,
        session_id: sessionId,
        step,
      }),
    })
    const data = await res.json()

    if (data.success) {
      onBooked({
        step,
        type: meetingType,
        datetime: selectedSlot,
        gcal_event_id: data.event_id,
      })
    }
    setBooking(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {step}
          </span>
          <div>
            <CardTitle className="text-xl">{meetingType}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TimeSlotPicker
          startDate={startDate}
          endDate={endDate}
          selectedSlot={selectedSlot}
          onSelect={setSelectedSlot}
        />
        <Button
          onClick={handleBook}
          disabled={!selectedSlot || booking}
          className="w-full"
          size="lg"
        >
          {booking ? 'Booking...' : `Book ${meetingType}`}
        </Button>
      </CardContent>
    </Card>
  )
}
