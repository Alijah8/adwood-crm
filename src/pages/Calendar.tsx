import { useState, useMemo } from 'react'
import { Header } from '../components/layout/Header'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useCRMStore } from '../store'
import { cn } from '../lib/utils'
import type { CalendarEvent } from '../types'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Video,
  Phone,
  Users,
  Clock,
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from 'date-fns'

const eventTypeConfig = {
  meeting: { icon: Users, color: 'bg-blue-500' },
  call: { icon: Phone, color: 'bg-green-500' },
  task: { icon: Clock, color: 'bg-yellow-500' },
  reminder: { icon: Clock, color: 'bg-purple-500' },
}

export function Calendar() {
  const { events, contacts, addEvent, deleteEvent } = useCRMStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'meeting' as CalendarEvent['type'],
    startTime: '',
    endTime: '',
    allDay: false,
    contactId: '',
    location: '',
    videoLink: '',
  })

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days: Date[] = []
    let day = startDate
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentMonth])

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      return isSameDay(eventDate, date)
    })
  }

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    return getEventsForDate(selectedDate)
  }, [selectedDate, events])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addEvent({
      ...formData,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
      contactId: formData.contactId || undefined,
    })
    resetForm()
  }

  const resetForm = () => {
    setShowForm(false)
    setFormData({
      title: '',
      description: '',
      type: 'meeting',
      startTime: '',
      endTime: '',
      allDay: false,
      contactId: '',
      location: '',
      videoLink: '',
    })
  }

  const handleAddEvent = () => {
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd'T'10:00")
      const endStr = format(selectedDate, "yyyy-MM-dd'T'11:00")
      setFormData({
        ...formData,
        startTime: dateStr,
        endTime: endStr,
      })
    }
    setShowForm(true)
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Calendar"
        subtitle={format(currentMonth, 'MMMM yyyy')}
        action={{
          label: 'Add Event',
          onClick: handleAddEvent,
        }}
      />

      <div className="flex-1 p-6 flex gap-6 overflow-hidden">
        {/* Calendar Grid */}
        <Card className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 flex-1">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDate(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={idx}
                    className={cn(
                      'min-h-[80px] p-1 border rounded-md cursor-pointer transition-colors',
                      isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                      isSelected && 'ring-2 ring-primary',
                      isToday && 'border-primary',
                      'hover:bg-accent/50'
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div
                      className={cn(
                        'text-sm font-medium mb-1',
                        !isCurrentMonth && 'text-muted-foreground',
                        isToday && 'text-primary'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((event) => {
                        const config = eventTypeConfig[event.type]
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              'text-xs px-1 py-0.5 rounded truncate text-white',
                              config.color
                            )}
                          >
                            {event.title}
                          </div>
                        )
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Event Details Sidebar */}
        <Card className="w-80 flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
            </h3>
          </div>
          <CardContent className="flex-1 overflow-auto p-4">
            {selectedDate ? (
              selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => {
                    const config = eventTypeConfig[event.type]
                    const Icon = config.icon
                    return (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn('p-1.5 rounded', config.color)}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(event.startTime), 'h:mm a')} -{' '}
                              {format(new Date(event.endTime), 'h:mm a')}
                            </p>
                            {event.videoLink && (
                              <a
                                href={event.videoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary flex items-center gap-1 mt-1"
                              >
                                <Video className="w-3 h-3" />
                                Join video call
                              </a>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No events scheduled
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a date to view events
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Add Event</h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 p-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CalendarEvent['type'] })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="call">Call</option>
                    <option value="task">Task</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Start Time *</label>
                    <Input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">End Time *</label>
                    <Input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Related Contact</label>
                  <select
                    value={formData.contactId}
                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select contact...</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Video Link</label>
                  <Input
                    value={formData.videoLink}
                    onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">Add Event</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
