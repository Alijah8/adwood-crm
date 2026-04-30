import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { cn } from '../../lib/utils'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface TimeSlotPickerProps {
  startDate: string
  endDate: string
  selectedSlot: string | null
  onSelect: (slot: string) => void
}

export function TimeSlotPicker({ startDate, endDate, selectedSlot, onSelect }: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [fetchEndDate, setFetchEndDate] = useState(endDate)

  useEffect(() => {
    fetchSlots()
  }, [startDate, fetchEndDate])

  async function fetchSlots() {
    setLoading(true)
    const res = await fetch(`${SUPABASE_URL}/functions/v1/get-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ start_date: startDate, end_date: fetchEndDate }),
    })
    const data = await res.json()
    const fetchedSlots = data.slots || []

    if (fetchedSlots.length === 0) {
      // Auto-extend by 2 weeks if no slots found
      const extended = new Date(new Date(fetchEndDate).getTime() + 14 * 86400000).toISOString()
      setFetchEndDate(extended)
      return
    }

    setSlots(fetchedSlots)
    // Auto-select the first available date
    if (!selectedDate && fetchedSlots.length > 0) {
      setSelectedDate(format(parseISO(fetchedSlots[0]), 'yyyy-MM-dd'))
    }
    setLoading(false)
  }

  // Group slots by date
  const slotsByDate: Record<string, string[]> = {}
  for (const slot of slots) {
    const dateKey = format(parseISO(slot), 'yyyy-MM-dd')
    if (!slotsByDate[dateKey]) slotsByDate[dateKey] = []
    slotsByDate[dateKey].push(slot)
  }

  const availableDates = Object.keys(slotsByDate).sort()
  const timesForSelectedDate = selectedDate ? slotsByDate[selectedDate] || [] : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="ml-3 text-muted-foreground">Loading available times...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Date selector */}
      <div>
        <p className="text-sm font-medium mb-2">Select a date</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {availableDates.map((date) => {
            const parsed = parseISO(date)
            const isSelected = date === selectedDate
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'flex flex-col items-center px-4 py-2 rounded-lg border min-w-[72px] transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <span className="text-xs font-medium">{format(parsed, 'EEE')}</span>
                <span className="text-lg font-semibold">{format(parsed, 'd')}</span>
                <span className="text-xs">{format(parsed, 'MMM')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots for selected date */}
      {selectedDate && (
        <div>
          <p className="text-sm font-medium mb-2">
            Available times for {format(parseISO(selectedDate), 'EEEE, MMMM d')}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {timesForSelectedDate.map((slot) => {
              const isSelected = slot === selectedSlot
              return (
                <button
                  key={slot}
                  onClick={() => onSelect(slot)}
                  className={cn(
                    'px-3 py-2 rounded-md border text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {format(parseISO(slot), 'h:mm a')}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
