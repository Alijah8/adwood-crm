export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  jobTitle?: string
  status: 'lead' | 'prospect' | 'customer' | 'churned'
  source: 'website' | 'referral' | 'meta_ads' | 'google_ads' | 'organic' | 'other'
  tags: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
  lastContactedAt?: Date
  assignedTo?: string
}

export interface Deal {
  id: string
  title: string
  value: number
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  contactId: string
  assignedTo?: string
  expectedCloseDate?: Date
  probability: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  assignedTo?: string
  relatedContactId?: string
  relatedDealId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  type: 'meeting' | 'call' | 'task' | 'reminder'
  startTime: Date
  endTime: Date
  allDay: boolean
  contactId?: string
  dealId?: string
  attendees?: string[]
  location?: string
  videoLink?: string
  createdAt: Date
  updatedAt: Date
}

export interface Communication {
  id: string
  type: 'email' | 'sms' | 'call' | 'meeting' | 'note'
  direction: 'inbound' | 'outbound'
  contactId: string
  subject?: string
  body: string
  status: 'draft' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied'
  sentAt?: Date
  createdAt: Date
}

export interface Staff {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'sales' | 'support'
  avatar?: string
  phone?: string
  isActive: boolean
  createdAt: Date
}

export interface Payment {
  id: string
  contactId: string
  dealId?: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: 'card' | 'bank_transfer' | 'cash' | 'other'
  description?: string
  invoiceNumber?: string
  dueDate?: Date
  paidAt?: Date
  createdAt: Date
}

export interface DashboardMetrics {
  totalContacts: number
  newContactsThisMonth: number
  activeDeals: number
  totalPipelineValue: number
  closedWonThisMonth: number
  closedWonValueThisMonth: number
  tasksOverdue: number
  upcomingMeetings: number
  revenueThisMonth: number
  conversionRate: number
}

export interface Funnel {
  id: string
  name: string
  description?: string
  stages: FunnelStage[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FunnelStage {
  id: string
  name: string
  order: number
  conversionRate?: number
  contactCount: number
}

export interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms' | 'social'
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
  targetAudience: string[]
  content: string
  scheduledAt?: Date
  sentCount: number
  openRate?: number
  clickRate?: number
  createdAt: Date
  updatedAt: Date
}
