import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Contact, Deal, Task, CalendarEvent, Communication, Staff, Payment, Campaign } from '../types'
import { generateId } from '../lib/utils'
import { supabase } from '../lib/supabase'

// --- Supabase <-> Entity mappers ---

function toDbContact(c: Contact) {
  return {
    id: c.id, first_name: c.firstName, last_name: c.lastName, email: c.email,
    phone: c.phone ?? null, company: c.company ?? null, job_title: c.jobTitle ?? null,
    status: c.status, source: c.source, tags: c.tags, notes: c.notes ?? null,
    assigned_to: c.assignedTo ?? null,
    last_contacted_at: c.lastContactedAt ? new Date(c.lastContactedAt).toISOString() : null,
  }
}

function fromDbContact(r: Record<string, unknown>): Contact {
  return {
    id: r.id as string, firstName: r.first_name as string, lastName: r.last_name as string,
    email: r.email as string, phone: (r.phone as string) ?? undefined,
    company: (r.company as string) ?? undefined, jobTitle: (r.job_title as string) ?? undefined,
    status: r.status as Contact['status'], source: r.source as Contact['source'],
    tags: (r.tags as string[]) ?? [], notes: (r.notes as string) ?? undefined,
    assignedTo: (r.assigned_to as string) ?? undefined,
    lastContactedAt: r.last_contacted_at ? new Date(r.last_contacted_at as string) : undefined,
    createdAt: new Date(r.created_at as string), updatedAt: new Date(r.updated_at as string),
  }
}

function toDbDeal(d: Deal) {
  return {
    id: d.id, title: d.title, value: d.value, stage: d.stage,
    contact_id: d.contactId ?? null, assigned_to: d.assignedTo ?? null,
    expected_close_date: d.expectedCloseDate ? new Date(d.expectedCloseDate).toISOString() : null,
    probability: d.probability, notes: d.notes ?? null,
  }
}

function fromDbDeal(r: Record<string, unknown>): Deal {
  return {
    id: r.id as string, title: r.title as string, value: Number(r.value),
    stage: r.stage as Deal['stage'], contactId: (r.contact_id as string) ?? '',
    assignedTo: (r.assigned_to as string) ?? undefined,
    expectedCloseDate: r.expected_close_date ? new Date(r.expected_close_date as string) : undefined,
    probability: Number(r.probability), notes: (r.notes as string) ?? undefined,
    createdAt: new Date(r.created_at as string), updatedAt: new Date(r.updated_at as string),
  }
}

function toDbTask(t: Task) {
  return {
    id: t.id, title: t.title, description: t.description ?? null,
    status: t.status, priority: t.priority,
    due_date: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    assigned_to: t.assignedTo ?? null,
    related_contact_id: t.relatedContactId ?? null,
    related_deal_id: t.relatedDealId ?? null,
  }
}

function fromDbTask(r: Record<string, unknown>): Task {
  return {
    id: r.id as string, title: r.title as string,
    description: (r.description as string) ?? undefined,
    status: r.status as Task['status'], priority: r.priority as Task['priority'],
    dueDate: r.due_date ? new Date(r.due_date as string) : undefined,
    assignedTo: (r.assigned_to as string) ?? undefined,
    relatedContactId: (r.related_contact_id as string) ?? undefined,
    relatedDealId: (r.related_deal_id as string) ?? undefined,
    createdAt: new Date(r.created_at as string), updatedAt: new Date(r.updated_at as string),
  }
}

function toDbEvent(e: CalendarEvent) {
  return {
    id: e.id, title: e.title, description: e.description ?? null, type: e.type,
    start_time: new Date(e.startTime).toISOString(),
    end_time: new Date(e.endTime).toISOString(),
    all_day: e.allDay, contact_id: e.contactId ?? null, deal_id: e.dealId ?? null,
    attendees: e.attendees ?? [], location: e.location ?? null,
    video_link: e.videoLink ?? null,
  }
}

function fromDbEvent(r: Record<string, unknown>): CalendarEvent {
  return {
    id: r.id as string, title: r.title as string,
    description: (r.description as string) ?? undefined,
    type: r.type as CalendarEvent['type'],
    startTime: new Date(r.start_time as string), endTime: new Date(r.end_time as string),
    allDay: r.all_day as boolean,
    contactId: (r.contact_id as string) ?? undefined,
    dealId: (r.deal_id as string) ?? undefined,
    attendees: (r.attendees as string[]) ?? undefined,
    location: (r.location as string) ?? undefined,
    videoLink: (r.video_link as string) ?? undefined,
    createdAt: new Date(r.created_at as string), updatedAt: new Date(r.updated_at as string),
  }
}

function toDbComm(c: Communication) {
  return {
    id: c.id, type: c.type, direction: c.direction, contact_id: c.contactId,
    subject: c.subject ?? null, body: c.body, status: c.status,
    sent_at: c.sentAt ? new Date(c.sentAt).toISOString() : null,
  }
}

function fromDbComm(r: Record<string, unknown>): Communication {
  return {
    id: r.id as string, type: r.type as Communication['type'],
    direction: r.direction as Communication['direction'],
    contactId: r.contact_id as string, subject: (r.subject as string) ?? undefined,
    body: r.body as string, status: r.status as Communication['status'],
    sentAt: r.sent_at ? new Date(r.sent_at as string) : undefined,
    createdAt: new Date(r.created_at as string),
  }
}

function toDbStaff(s: Staff) {
  return {
    id: s.id, name: s.name, email: s.email, role: s.role,
    avatar: s.avatar ?? null, phone: s.phone ?? null, is_active: s.isActive,
  }
}

function fromDbStaff(r: Record<string, unknown>): Staff {
  return {
    id: r.id as string, name: r.name as string, email: r.email as string,
    role: r.role as Staff['role'], avatar: (r.avatar as string) ?? undefined,
    phone: (r.phone as string) ?? undefined, isActive: r.is_active as boolean,
    createdAt: new Date(r.created_at as string),
  }
}

function toDbPayment(p: Payment) {
  return {
    id: p.id, contact_id: p.contactId, deal_id: p.dealId ?? null,
    amount: p.amount, status: p.status, method: p.method,
    description: p.description ?? null, invoice_number: p.invoiceNumber ?? null,
    due_date: p.dueDate ? new Date(p.dueDate).toISOString() : null,
    paid_at: p.paidAt ? new Date(p.paidAt).toISOString() : null,
  }
}

function fromDbPayment(r: Record<string, unknown>): Payment {
  return {
    id: r.id as string, contactId: r.contact_id as string,
    dealId: (r.deal_id as string) ?? undefined,
    amount: Number(r.amount), status: r.status as Payment['status'],
    method: r.method as Payment['method'],
    description: (r.description as string) ?? undefined,
    invoiceNumber: (r.invoice_number as string) ?? undefined,
    dueDate: r.due_date ? new Date(r.due_date as string) : undefined,
    paidAt: r.paid_at ? new Date(r.paid_at as string) : undefined,
    createdAt: new Date(r.created_at as string),
  }
}

function toDbCampaign(c: Campaign) {
  return {
    id: c.id, name: c.name, type: c.type, status: c.status,
    target_audience: c.targetAudience, content: c.content,
    scheduled_at: c.scheduledAt ? new Date(c.scheduledAt).toISOString() : null,
    sent_count: c.sentCount, open_rate: c.openRate ?? null,
    click_rate: c.clickRate ?? null,
  }
}

function fromDbCampaign(r: Record<string, unknown>): Campaign {
  return {
    id: r.id as string, name: r.name as string,
    type: r.type as Campaign['type'], status: r.status as Campaign['status'],
    targetAudience: (r.target_audience as string[]) ?? [],
    content: r.content as string,
    scheduledAt: r.scheduled_at ? new Date(r.scheduled_at as string) : undefined,
    sentCount: Number(r.sent_count),
    openRate: r.open_rate != null ? Number(r.open_rate) : undefined,
    clickRate: r.click_rate != null ? Number(r.click_rate) : undefined,
    createdAt: new Date(r.created_at as string), updatedAt: new Date(r.updated_at as string),
  }
}

// --- Generic Supabase partial-update builder ---

const CONTACT_FIELD_MAP: Record<string, string> = {
  firstName: 'first_name', lastName: 'last_name', email: 'email', phone: 'phone',
  company: 'company', jobTitle: 'job_title', status: 'status', source: 'source',
  tags: 'tags', notes: 'notes', assignedTo: 'assigned_to', lastContactedAt: 'last_contacted_at',
}

const DEAL_FIELD_MAP: Record<string, string> = {
  title: 'title', value: 'value', stage: 'stage', contactId: 'contact_id',
  assignedTo: 'assigned_to', expectedCloseDate: 'expected_close_date',
  probability: 'probability', notes: 'notes',
}

const TASK_FIELD_MAP: Record<string, string> = {
  title: 'title', description: 'description', status: 'status', priority: 'priority',
  dueDate: 'due_date', assignedTo: 'assigned_to',
  relatedContactId: 'related_contact_id', relatedDealId: 'related_deal_id',
}

const EVENT_FIELD_MAP: Record<string, string> = {
  title: 'title', description: 'description', type: 'type',
  startTime: 'start_time', endTime: 'end_time', allDay: 'all_day',
  contactId: 'contact_id', dealId: 'deal_id', attendees: 'attendees',
  location: 'location', videoLink: 'video_link',
}

const PAYMENT_FIELD_MAP: Record<string, string> = {
  contactId: 'contact_id', dealId: 'deal_id', amount: 'amount', status: 'status',
  method: 'method', description: 'description', invoiceNumber: 'invoice_number',
  dueDate: 'due_date', paidAt: 'paid_at',
}

const CAMPAIGN_FIELD_MAP: Record<string, string> = {
  name: 'name', type: 'type', status: 'status', targetAudience: 'target_audience',
  content: 'content', scheduledAt: 'scheduled_at', sentCount: 'sent_count',
  openRate: 'open_rate', clickRate: 'click_rate',
}

const DATE_FIELDS = new Set([
  'last_contacted_at', 'expected_close_date', 'due_date',
  'start_time', 'end_time', 'sent_at', 'paid_at', 'scheduled_at',
])

function buildDbUpdate(data: Record<string, unknown>, fieldMap: Record<string, string>, includeUpdatedAt = true) {
  const dbUpdate: Record<string, unknown> = includeUpdatedAt ? { updated_at: new Date().toISOString() } : {}
  for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
    if (data[jsKey] !== undefined) {
      const val = data[jsKey]
      dbUpdate[dbKey] = DATE_FIELDS.has(dbKey) && val ? new Date(val as string | number).toISOString() : (val ?? null)
    }
  }
  return dbUpdate
}

// --- Store interface ---

interface CRMStore {
  contacts: Contact[]; deals: Deal[]; tasks: Task[]; events: CalendarEvent[]
  communications: Communication[]; staff: Staff[]; payments: Payment[]; campaigns: Campaign[]
  sidebarOpen: boolean; darkMode: boolean

  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateContact: (id: string, data: Partial<Contact>) => void
  deleteContact: (id: string) => void

  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateDeal: (id: string, data: Partial<Deal>) => void
  deleteDeal: (id: string) => void

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, data: Partial<Task>) => void
  deleteTask: (id: string) => void

  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEvent: (id: string, data: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void

  addCommunication: (comm: Omit<Communication, 'id' | 'createdAt'>) => void

  addStaff: (staff: Omit<Staff, 'id' | 'createdAt'>) => void
  updateStaff: (id: string, data: Partial<Staff>) => void

  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void
  updatePayment: (id: string, data: Partial<Payment>) => void

  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCampaign: (id: string, data: Partial<Campaign>) => void

  toggleSidebar: () => void
  toggleDarkMode: () => void

  importContacts: (contacts: Contact[]) => void
  clearAllData: () => void
  fetchAll: () => Promise<void>
}

// --- Store ---

export const useCRMStore = create<CRMStore>()(
  persist(
    (set) => ({
      // All data loaded from Supabase via fetchAll
      contacts: [], deals: [], tasks: [], events: [],
      communications: [], staff: [], payments: [], campaigns: [],

      sidebarOpen: true,
      darkMode: false,

      // --- Contacts (Supabase-backed) ---

      addContact: async (contact) => {
        const newContact: Contact = { ...contact, id: generateId(), createdAt: new Date(), updatedAt: new Date() }
        const { error } = await supabase.from('contacts').insert(toDbContact(newContact))
        if (error) { console.error('Supabase insert contact:', error); return }
        set((s) => ({ contacts: [...s.contacts, newContact] }))

        if (newContact.email && (newContact.status === 'customer' || newContact.tags?.includes('Customer'))) {
          supabase.from('customer_emails').upsert(
            { email: newContact.email, contact_name: `${newContact.firstName} ${newContact.lastName}`.trim() },
            { onConflict: 'email' }
          ).then(() => {})
        }
      },

      updateContact: async (id, data) => {
        const AI_TAGS = ['missed appointment', 'long appointment', 'Prospect', 'Batch']
        const oldContact = useCRMStore.getState().contacts.find((c) => c.id === id)
        if (!oldContact) return
        const merged = { ...oldContact, ...data, updatedAt: new Date() }

        const { error } = await supabase.from('contacts').update(buildDbUpdate(data as Record<string, unknown>, CONTACT_FIELD_MAP)).eq('id', id)
        if (error) { console.error('Supabase update contact:', error); return }
        set((s) => ({ contacts: s.contacts.map((c) => c.id === id ? merged : c) }))

        if (merged.email && (
          (data.status === 'customer' && oldContact.status !== 'customer') ||
          (data.tags && data.tags.includes('Customer') && !oldContact.tags.includes('Customer'))
        )) {
          supabase.from('customer_emails').upsert(
            { email: merged.email, contact_name: `${merged.firstName} ${merged.lastName}`.trim() },
            { onConflict: 'email' }
          ).then(() => {})
        }

        if (data.tags) {
          const newTags = data.tags.filter((t: string) => AI_TAGS.includes(t) && !oldContact.tags.includes(t))
          if (newTags.length > 0) {
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            if (currentSession?.access_token) {
              const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-proxy`
              newTags.forEach((tag: string) => {
                fetch(proxyUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentSession.access_token}`,
                  },
                  body: JSON.stringify({
                    webhook: 'https://n8n.srv1244261.hstgr.cloud/webhook/sam-tag-listener',
                    payload: { contact: merged, tag, contactId: id },
                  }),
                }).catch(() => {})
              })
            }
          }
        }
      },

      deleteContact: async (id) => {
        const { error } = await supabase.from('contacts').update({ deleted_at: new Date().toISOString() }).eq('id', id)
        if (error) { console.error('Supabase soft-delete contact:', error); return }
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }))
      },

      // --- Deals (Supabase-backed) ---

      addDeal: async (deal) => {
        const newDeal: Deal = { ...deal, id: generateId(), createdAt: new Date(), updatedAt: new Date() }
        const { error } = await supabase.from('deals').insert(toDbDeal(newDeal))
        if (error) { console.error('Supabase insert deal:', error); return }
        set((s) => ({ deals: [...s.deals, newDeal] }))
      },

      updateDeal: async (id, data) => {
        const old = useCRMStore.getState().deals.find((d) => d.id === id)
        if (!old) return
        const merged = { ...old, ...data, updatedAt: new Date() }
        const { error } = await supabase.from('deals').update(buildDbUpdate(data as Record<string, unknown>, DEAL_FIELD_MAP)).eq('id', id)
        if (error) { console.error('Supabase update deal:', error); return }
        set((s) => ({ deals: s.deals.map((d) => d.id === id ? merged : d) }))
      },

      deleteDeal: async (id) => {
        const { error } = await supabase.from('deals').delete().eq('id', id)
        if (error) { console.error('Supabase delete deal:', error); return }
        set((s) => ({ deals: s.deals.filter((d) => d.id !== id) }))
      },

      // --- Tasks (Supabase-backed) ---

      addTask: async (task) => {
        const newTask: Task = { ...task, id: generateId(), createdAt: new Date(), updatedAt: new Date() }
        const { error } = await supabase.from('tasks').insert(toDbTask(newTask))
        if (error) { console.error('Supabase insert task:', error); return }
        set((s) => ({ tasks: [...s.tasks, newTask] }))
      },

      updateTask: async (id, data) => {
        const old = useCRMStore.getState().tasks.find((t) => t.id === id)
        if (!old) return
        const merged = { ...old, ...data, updatedAt: new Date() }
        const { error } = await supabase.from('tasks').update(buildDbUpdate(data as Record<string, unknown>, TASK_FIELD_MAP)).eq('id', id)
        if (error) { console.error('Supabase update task:', error); return }
        set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? merged : t) }))
      },

      deleteTask: async (id) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id)
        if (error) { console.error('Supabase delete task:', error); return }
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
      },

      // --- Events (Supabase-backed) ---

      addEvent: async (event) => {
        const newEvent: CalendarEvent = { ...event, id: generateId(), createdAt: new Date(), updatedAt: new Date() }
        const { error } = await supabase.from('calendar_events').insert(toDbEvent(newEvent))
        if (error) { console.error('Supabase insert event:', error); return }
        set((s) => ({ events: [...s.events, newEvent] }))
      },

      updateEvent: async (id, data) => {
        const old = useCRMStore.getState().events.find((e) => e.id === id)
        if (!old) return
        const merged = { ...old, ...data, updatedAt: new Date() }
        const { error } = await supabase.from('calendar_events').update(buildDbUpdate(data as Record<string, unknown>, EVENT_FIELD_MAP)).eq('id', id)
        if (error) { console.error('Supabase update event:', error); return }
        set((s) => ({ events: s.events.map((e) => e.id === id ? merged : e) }))
      },

      deleteEvent: async (id) => {
        const { error } = await supabase.from('calendar_events').delete().eq('id', id)
        if (error) { console.error('Supabase delete event:', error); return }
        set((s) => ({ events: s.events.filter((e) => e.id !== id) }))
      },

      // --- Communications (Supabase-backed) ---

      addCommunication: async (comm) => {
        const newComm: Communication = { ...comm, id: generateId(), createdAt: new Date() }
        const { error } = await supabase.from('communications').insert(toDbComm(newComm))
        if (error) { console.error('Supabase insert communication:', error); return }
        set((s) => ({ communications: [...s.communications, newComm] }))
      },

      // --- Staff (Supabase-backed) ---

      addStaff: async (staff) => {
        const newStaff: Staff = { ...staff, id: generateId(), createdAt: new Date() }
        const { error } = await supabase.from('staff').insert(toDbStaff(newStaff))
        if (error) { console.error('Supabase insert staff:', error); return }
        set((s) => ({ staff: [...s.staff, newStaff] }))
      },

      updateStaff: async (id, data) => {
        const old = useCRMStore.getState().staff.find((s) => s.id === id)
        if (!old) return
        const merged = { ...old, ...data }
        const dbUpdate: Record<string, unknown> = {}
        if (data.name !== undefined) dbUpdate.name = data.name
        if (data.email !== undefined) dbUpdate.email = data.email
        if (data.role !== undefined) dbUpdate.role = data.role
        if (data.avatar !== undefined) dbUpdate.avatar = data.avatar ?? null
        if (data.phone !== undefined) dbUpdate.phone = data.phone ?? null
        if (data.isActive !== undefined) dbUpdate.is_active = data.isActive
        const { error } = await supabase.from('staff').update(dbUpdate).eq('id', id)
        if (error) { console.error('Supabase update staff:', error); return }
        set((s) => ({ staff: s.staff.map((st) => st.id === id ? merged : st) }))
      },

      // --- Payments (Supabase-backed) ---

      addPayment: async (payment) => {
        const newPayment: Payment = { ...payment, id: generateId(), createdAt: new Date() }
        const { error } = await supabase.from('payments').insert(toDbPayment(newPayment))
        if (error) { console.error('Supabase insert payment:', error); return }
        set((s) => ({ payments: [...s.payments, newPayment] }))
      },

      updatePayment: async (id, data) => {
        const old = useCRMStore.getState().payments.find((p) => p.id === id)
        if (!old) return
        const merged = { ...old, ...data }
        const { error } = await supabase.from('payments').update(buildDbUpdate(data as Record<string, unknown>, PAYMENT_FIELD_MAP, false)).eq('id', id)
        if (error) { console.error('Supabase update payment:', error); return }
        set((s) => ({ payments: s.payments.map((p) => p.id === id ? merged : p) }))
      },

      // --- Campaigns (Supabase-backed) ---

      addCampaign: async (campaign) => {
        const newCampaign: Campaign = { ...campaign, id: generateId(), createdAt: new Date(), updatedAt: new Date() }
        const { error } = await supabase.from('campaigns').insert(toDbCampaign(newCampaign))
        if (error) { console.error('Supabase insert campaign:', error); return }
        set((s) => ({ campaigns: [...s.campaigns, newCampaign] }))
      },

      updateCampaign: async (id, data) => {
        const old = useCRMStore.getState().campaigns.find((c) => c.id === id)
        if (!old) return
        const merged = { ...old, ...data, updatedAt: new Date() }
        const { error } = await supabase.from('campaigns').update(buildDbUpdate(data as Record<string, unknown>, CAMPAIGN_FIELD_MAP)).eq('id', id)
        if (error) { console.error('Supabase update campaign:', error); return }
        set((s) => ({ campaigns: s.campaigns.map((c) => c.id === id ? merged : c) }))
      },

      // --- UI ---

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      toggleDarkMode: () => set((s) => {
        const newDarkMode = !s.darkMode
        if (newDarkMode) { document.documentElement.classList.add('dark') }
        else { document.documentElement.classList.remove('dark') }
        return { darkMode: newDarkMode }
      }),

      // --- Bulk ---

      importContacts: async (contacts) => {
        if (contacts.length === 0) return
        const { error } = await supabase.from('contacts').upsert(contacts.map(toDbContact), { onConflict: 'id' })
        if (error) { console.error('Supabase import contacts:', error); return }
        set((s) => ({ contacts: [...s.contacts, ...contacts] }))
      },

      clearAllData: async () => {
        const now = new Date().toISOString()
        await Promise.all([
          supabase.from('contacts').update({ deleted_at: now }).is('deleted_at', null),
          supabase.from('deals').update({ deleted_at: now }).is('deleted_at', null),
          supabase.from('tasks').update({ deleted_at: now }).is('deleted_at', null),
          supabase.from('calendar_events').update({ deleted_at: now }).is('deleted_at', null),
          supabase.from('communications').update({ deleted_at: now }).is('deleted_at', null),
          supabase.from('staff').update({ deleted_at: now }).is('deleted_at', null),
          supabase.from('payments').update({ deleted_at: now }).is('deleted_at', null),
          supabase.from('campaigns').update({ deleted_at: now }).is('deleted_at', null),
        ])
        set({ contacts: [], deals: [], tasks: [], events: [], communications: [], payments: [], campaigns: [], staff: [] })
      },

      // --- Supabase fetch all ---

      fetchAll: async () => {
        const [contacts, deals, tasks, events, comms, staffRows, payments, campaigns] = await Promise.all([
          supabase.from('contacts').select('*').order('created_at', { ascending: false }),
          supabase.from('deals').select('*').order('created_at', { ascending: false }),
          supabase.from('tasks').select('*').order('created_at', { ascending: false }),
          supabase.from('calendar_events').select('*').order('start_time', { ascending: true }),
          supabase.from('communications').select('*').order('created_at', { ascending: false }),
          supabase.from('staff').select('*').order('created_at', { ascending: true }),
          supabase.from('payments').select('*').order('created_at', { ascending: false }),
          supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        ])
        set({
          contacts: contacts.data?.map(fromDbContact) ?? [],
          deals: deals.data?.map(fromDbDeal) ?? [],
          tasks: tasks.data?.map(fromDbTask) ?? [],
          events: events.data?.map(fromDbEvent) ?? [],
          communications: comms.data?.map(fromDbComm) ?? [],
          staff: staffRows.data?.map(fromDbStaff) ?? [],
          payments: payments.data?.map(fromDbPayment) ?? [],
          campaigns: campaigns.data?.map(fromDbCampaign) ?? [],
        })
      },
    }),
    {
      name: 'adwood-crm-storage',
      partialize: (state) => ({
        // Only persist UI preferences — all data lives in Supabase
        sidebarOpen: state.sidebarOpen,
        darkMode: state.darkMode,
      }),
    }
  )
)
