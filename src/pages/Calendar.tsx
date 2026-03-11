import { useState, useMemo } from 'react'
import { Header } from '../components/layout/Header'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
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
  Mail,
  Pencil,
  LinkIcon,
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

const TEMPLATE_LABELS: Record<string, string> = {
  booking_confirm_email: 'Booking confirmation',
  booking_confirm_sms: 'Booking confirmation (SMS)',
  booking_staff_notify_email: 'Staff notification',
  booking_staff_notify_sms: 'Staff notification (SMS)',
  reminder_48h_email: '48h reminder',
  reminder_48h_sms: '48h reminder (SMS)',
  reminder_24h_email: '24h reminder',
  reminder_24h_sms: '24h reminder (SMS)',
  reminder_6h_email: '6h reminder',
  reminder_6h_sms: '6h reminder (SMS)',
  reminder_1h_email: '1h reminder',
  reminder_1h_sms: '1h reminder (SMS)',
  reminder_1h_staff_email: '1h staff reminder',
}

const statusColors: Record<string, string> = {
  pending: 'secondary',
  sent: 'success',
  failed: 'destructive',
  cancelled: 'secondary',
  skipped: 'secondary',
}

export function Calendar() {
  const { events, contacts, deals, reminders, addEvent, updateEvent, deleteEvent } = useCRMStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
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
    if (editingEventId) {
      updateEvent(editingEventId, {
        ...formData,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        contactId: formData.contactId || undefined,
      })
    } else {
      addEvent({
        ...formData,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        contactId: formData.contactId || undefined,
      })
    }
    resetForm()
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingEventId(null)
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
    setEditingEventId(null)
    setShowForm(true)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEventId(event.id)
    setFormData({
      title: event.title,
      description: event.description || '',
      type: event.type,
      startTime: format(new Date(event.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(event.endTime), "yyyy-MM-dd'T'HH:mm"),
      allDay: event.allDay,
      contactId: event.contactId || '',
      location: event.location || '',
      videoLink: event.videoLink || '',
    })
    setShowForm(true)
  }

  const getEventReminders = (eventId: string) => {
    return reminders.filter((r) => r.eventId === eventId)
  }

  const getEventDeal = (event: CalendarEvent) => {
    if (!event.dealId) return null
    return deals.find((d) => d.id === event.dealId) ?? null
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
                    const eventReminders = getEventReminders(event.id)
                    const eventDeal = getEventDeal(event)
                    const emailReminders = eventReminders.filter((r) => r.channel === 'email')
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
                            {eventDeal && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <LinkIcon className="w-3 h-3" />
                                Deal: {eventDeal.title}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEditEvent(event)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
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

                        {/* Reminder status list */}
                        {emailReminders.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-border space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Reminders</p>
                            {emailReminders.map((r) => (
                              <div key={r.id} className="flex items-center gap-2 text-xs">
                                <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="flex-1 truncate">
                                  {TEMPLATE_LABELS[r.templateKey] || r.templateKey}
                                </span>
                                <Badge
                                  variant={statusColors[r.status] as 'success' | 'destructive' | 'secondary'}
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {r.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
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

      {/* Add/Edit Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">
                {editingEventId ? 'Edit Event' : 'Add Event'}
              </h2>
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
                <Button type="submit">
                  {editingEventId ? 'Save Changes' : 'Add Event'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
