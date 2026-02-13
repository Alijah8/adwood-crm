import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Contact, Deal, Task, CalendarEvent, Communication, Staff, Payment, Campaign } from '../types'
import { generateId } from '../lib/utils'

interface CRMStore {
  // Data
  contacts: Contact[]
  deals: Deal[]
  tasks: Task[]
  events: CalendarEvent[]
  communications: Communication[]
  staff: Staff[]
  payments: Payment[]
  campaigns: Campaign[]

  // UI State
  sidebarOpen: boolean
  darkMode: boolean

  // Actions - Contacts
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateContact: (id: string, data: Partial<Contact>) => void
  deleteContact: (id: string) => void

  // Actions - Deals
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateDeal: (id: string, data: Partial<Deal>) => void
  deleteDeal: (id: string) => void

  // Actions - Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, data: Partial<Task>) => void
  deleteTask: (id: string) => void

  // Actions - Events
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEvent: (id: string, data: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void

  // Actions - Communications
  addCommunication: (comm: Omit<Communication, 'id' | 'createdAt'>) => void

  // Actions - Staff
  addStaff: (staff: Omit<Staff, 'id' | 'createdAt'>) => void
  updateStaff: (id: string, data: Partial<Staff>) => void

  // Actions - Payments
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void
  updatePayment: (id: string, data: Partial<Payment>) => void

  // Actions - Campaigns
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCampaign: (id: string, data: Partial<Campaign>) => void

  // UI Actions
  toggleSidebar: () => void
  toggleDarkMode: () => void

  // Bulk actions
  importContacts: (contacts: Contact[]) => void
  clearAllData: () => void
}

// Sample data for demo
const sampleContacts: Contact[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@techcorp.com',
    phone: '+1 (555) 123-4567',
    company: 'TechCorp Industries',
    jobTitle: 'VP of Operations',
    status: 'customer',
    source: 'referral',
    tags: ['enterprise', 'high-value'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
    lastContactedAt: new Date('2024-02-10'),
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'mchen@startupxyz.io',
    phone: '+1 (555) 234-5678',
    company: 'StartupXYZ',
    jobTitle: 'Founder & CEO',
    status: 'prospect',
    source: 'meta_ads',
    tags: ['startup', 'saas'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-08'),
  },
  {
    id: '3',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.r@designstudio.co',
    phone: '+1 (555) 345-6789',
    company: 'Design Studio Co',
    jobTitle: 'Creative Director',
    status: 'lead',
    source: 'website',
    tags: ['creative', 'agency'],
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '4',
    firstName: 'David',
    lastName: 'Kim',
    email: 'dkim@financepro.com',
    phone: '+1 (555) 456-7890',
    company: 'FinancePro Solutions',
    jobTitle: 'CFO',
    status: 'customer',
    source: 'referral',
    tags: ['finance', 'enterprise'],
    createdAt: new Date('2023-11-20'),
    updatedAt: new Date('2024-01-15'),
    lastContactedAt: new Date('2024-02-12'),
  },
  {
    id: '5',
    firstName: 'Jessica',
    lastName: 'Taylor',
    email: 'jtaylor@marketingagency.com',
    company: 'Marketing Agency Plus',
    jobTitle: 'Marketing Director',
    status: 'prospect',
    source: 'google_ads',
    tags: ['marketing', 'agency'],
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-08'),
  },
]

const sampleDeals: Deal[] = [
  {
    id: '1',
    title: 'TechCorp Annual Contract Renewal',
    value: 75000,
    stage: 'negotiation',
    contactId: '1',
    probability: 80,
    expectedCloseDate: new Date('2024-03-15'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '2',
    title: 'StartupXYZ Implementation',
    value: 25000,
    stage: 'proposal',
    contactId: '2',
    probability: 60,
    expectedCloseDate: new Date('2024-03-01'),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-08'),
  },
  {
    id: '3',
    title: 'Design Studio Consulting Package',
    value: 15000,
    stage: 'qualified',
    contactId: '3',
    probability: 40,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '4',
    title: 'FinancePro Expansion',
    value: 120000,
    stage: 'won',
    contactId: '4',
    probability: 100,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-15'),
  },
]

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Follow up with Sarah on contract terms',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date('2024-02-15'),
    relatedContactId: '1',
    relatedDealId: '1',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '2',
    title: 'Send proposal to Michael',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2024-02-14'),
    relatedContactId: '2',
    relatedDealId: '2',
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-08'),
  },
  {
    id: '3',
    title: 'Schedule discovery call with Emily',
    status: 'completed',
    priority: 'medium',
    relatedContactId: '3',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-07'),
  },
]

const sampleEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Contract Review Call - TechCorp',
    type: 'call',
    startTime: new Date('2024-02-15T10:00:00'),
    endTime: new Date('2024-02-15T11:00:00'),
    allDay: false,
    contactId: '1',
    dealId: '1',
    videoLink: 'https://zoom.us/j/123456789',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '2',
    title: 'Proposal Presentation - StartupXYZ',
    type: 'meeting',
    startTime: new Date('2024-02-16T14:00:00'),
    endTime: new Date('2024-02-16T15:30:00'),
    allDay: false,
    contactId: '2',
    dealId: '2',
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-08'),
  },
]

const sampleStaff: Staff[] = [
  {
    id: '1',
    name: 'Alijah Wood',
    email: 'alijah@adwoodconsulting.us',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
]

const samplePayments: Payment[] = [
  {
    id: '1',
    contactId: '4',
    dealId: '4',
    amount: 60000,
    status: 'completed',
    method: 'bank_transfer',
    description: 'FinancePro Expansion - First Payment',
    invoiceNumber: 'INV-2024-001',
    paidAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    contactId: '4',
    dealId: '4',
    amount: 60000,
    status: 'pending',
    method: 'bank_transfer',
    description: 'FinancePro Expansion - Second Payment',
    invoiceNumber: 'INV-2024-002',
    dueDate: new Date('2024-02-20'),
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    contactId: '1',
    amount: 25000,
    status: 'completed',
    method: 'card',
    description: 'TechCorp Monthly Service',
    invoiceNumber: 'INV-2024-003',
    paidAt: new Date('2024-02-01'),
    createdAt: new Date('2024-02-01'),
  },
]

export const useCRMStore = create<CRMStore>()(
  persist(
    (set) => ({
      // Initial data
      contacts: sampleContacts,
      deals: sampleDeals,
      tasks: sampleTasks,
      events: sampleEvents,
      communications: [],
      staff: sampleStaff,
      payments: samplePayments,
      campaigns: [],

      // UI State
      sidebarOpen: true,
      darkMode: false,

      // Contact actions
      addContact: (contact) =>
        set((state) => ({
          contacts: [
            ...state.contacts,
            {
              ...contact,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateContact: (id, data) => {
        const AI_TAGS = ['missed appointment', 'long appointment', 'Prospect', 'Batch']
        set((state) => {
          const oldContact = state.contacts.find((c) => c.id === id)
          const updatedContacts = state.contacts.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date() } : c
          )
          if (data.tags && oldContact) {
            const newTags = data.tags.filter(
              (t: string) => AI_TAGS.includes(t) && !oldContact.tags.includes(t)
            )
            if (newTags.length > 0) {
              const updatedContact = updatedContacts.find((c) => c.id === id)
              newTags.forEach((tag: string) => {
                fetch('https://n8n.srv1244261.hstgr.cloud/webhook/sam-tag-listener', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ contact: updatedContact, tag, contactId: id }),
                }).catch(() => {})
              })
            }
          }
          return { contacts: updatedContacts }
        })
      },

      deleteContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
        })),

      // Deal actions
      addDeal: (deal) =>
        set((state) => ({
          deals: [
            ...state.deals,
            {
              ...deal,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateDeal: (id, data) =>
        set((state) => ({
          deals: state.deals.map((d) =>
            d.id === id ? { ...d, ...data, updatedAt: new Date() } : d
          ),
        })),

      deleteDeal: (id) =>
        set((state) => ({
          deals: state.deals.filter((d) => d.id !== id),
        })),

      // Task actions
      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateTask: (id, data) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date() } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      // Event actions
      addEvent: (event) =>
        set((state) => ({
          events: [
            ...state.events,
            {
              ...event,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateEvent: (id, data) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...data, updatedAt: new Date() } : e
          ),
        })),

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),

      // Communication actions
      addCommunication: (comm) =>
        set((state) => ({
          communications: [
            ...state.communications,
            {
              ...comm,
              id: generateId(),
              createdAt: new Date(),
            },
          ],
        })),

      // Staff actions
      addStaff: (staff) =>
        set((state) => ({
          staff: [
            ...state.staff,
            {
              ...staff,
              id: generateId(),
              createdAt: new Date(),
            },
          ],
        })),

      updateStaff: (id, data) =>
        set((state) => ({
          staff: state.staff.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),

      // Payment actions
      addPayment: (payment) =>
        set((state) => ({
          payments: [
            ...state.payments,
            {
              ...payment,
              id: generateId(),
              createdAt: new Date(),
            },
          ],
        })),

      updatePayment: (id, data) =>
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),

      // Campaign actions
      addCampaign: (campaign) =>
        set((state) => ({
          campaigns: [
            ...state.campaigns,
            {
              ...campaign,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateCampaign: (id, data) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date() } : c
          ),
        })),

      // UI actions
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      toggleDarkMode: () =>
        set((state) => {
          const newDarkMode = !state.darkMode
          if (newDarkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { darkMode: newDarkMode }
        }),

      // Bulk actions
      importContacts: (contacts) =>
        set((state) => ({
          contacts: [...state.contacts, ...contacts],
        })),

      clearAllData: () =>
        set({
          contacts: [],
          deals: [],
          tasks: [],
          events: [],
          communications: [],
          payments: [],
          campaigns: [],
        }),
    }),
    {
      name: 'adwood-crm-storage',
    }
  )
)
