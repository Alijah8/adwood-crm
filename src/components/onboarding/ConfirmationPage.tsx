import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'

interface Meeting {
  step: number
  type: string
  datetime: string
  gcal_event_id: string
}

interface ConfirmationPageProps {
  clientName: string
  meetings: Meeting[]
}

function generateICS(meetings: Meeting[]): string {
  const events = meetings
    .sort((a, b) => a.step - b.step)
    .map((m) => {
      const start = new Date(m.datetime)
      const end = new Date(start.getTime() + 30 * 60 * 1000)
      const dtStart = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      const dtEnd = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      return `BEGIN:VEVENT
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:ADWC: ${m.type}
DESCRIPTION:AD Wood Consulting onboarding meeting
END:VEVENT`
    })
    .join('\n')

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AD Wood Consulting//Onboarding//EN
${events}
END:VCALENDAR`
}

export function ConfirmationPage({ clientName, meetings }: ConfirmationPageProps) {
  const sorted = [...meetings].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

  function downloadICS() {
    const ics = generateICS(meetings)
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'adwc-onboarding-schedule.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold">You're all set, {clientName.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">
          All 9 meetings have been scheduled. You'll receive calendar invites at your email.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Onboarding Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sorted.map((meeting, i) => (
              <div key={meeting.step} className="flex items-center gap-4 py-2 border-b last:border-0">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{meeting.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(meeting.datetime), 'EEEE, MMMM d, yyyy · h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={downloadICS} variant="outline" size="lg">
          Download Calendar File (.ics)
        </Button>
      </div>
    </div>
  )
}
