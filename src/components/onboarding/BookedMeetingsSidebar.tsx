import { format, parseISO } from 'date-fns'
import { cn } from '../../lib/utils'

interface Meeting {
  step: number
  type: string
  datetime: string
  gcal_event_id: string
}

const ALL_MEETINGS = [
  'Cash Flow Tracking Call',
  'Application Call',
  'Medical Exam Call',
  'Requirements Call',
  '2nd Requirements Call',
  'Budget Check-In Call',
  'Final Policy Receipt Call',
  'Loan Walkthrough Call',
  'Final Onboarding Call',
]

interface BookedMeetingsSidebarProps {
  bookedMeetings: Meeting[]
  currentStep: number
}

export function BookedMeetingsSidebar({ bookedMeetings, currentStep }: BookedMeetingsSidebarProps) {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
        Your Schedule
      </h3>
      {ALL_MEETINGS.map((name, index) => {
        const stepNum = index + 1
        const booked = bookedMeetings.find((m) => m.step === stepNum)
        const isCurrent = stepNum === currentStep
        const isPending = !booked && stepNum > currentStep

        return (
          <div
            key={stepNum}
            className={cn(
              'flex items-start gap-3 p-2 rounded-md text-sm',
              isCurrent && 'bg-accent'
            )}
          >
            <div className="mt-0.5">
              {booked ? (
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : isCurrent ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-medium truncate',
                isPending && 'text-muted-foreground'
              )}>
                {name}
              </p>
              {booked && (
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(booked.datetime), 'EEE, MMM d · h:mm a')}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
