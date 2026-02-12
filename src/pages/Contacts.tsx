import { useState, useMemo } from 'react'
import { Header } from '../components/layout/Header'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { useCRMStore } from '../store'
import { formatDate, getInitials } from '../lib/utils'
import type { Contact } from '../types'
import { CSVImportModal } from '../components/CSVImportModal'
import {
  Search,
  Mail,
  Building2,
  X,
  Upload,
  Tag,
  UserSearch,
} from 'lucide-react'

const statusColors = {
  lead: 'secondary',
  prospect: 'info',
  customer: 'success',
  churned: 'destructive',
} as const

const sourceLabels = {
  website: 'Website',
  referral: 'Referral',
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  organic: 'Organic',
  other: 'Other',
}

// AI-managed tags that agents can apply to contacts
const AI_TAGS = [
  { value: 'missed appointment', label: 'Missed Appt', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'long appointment', label: 'Long Appt', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { value: 'Batch', label: 'Batch', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'avatar_lead', label: 'Avatar Lead', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
]

// Map tag values to their display colors
const tagColorMap: Record<string, string> = Object.fromEntries(
  AI_TAGS.map(t => [t.value, t.color])
)

export function Contacts() {
  const { contacts, addContact, updateContact, deleteContact } = useCRMStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'contacts' | 'new_avatar'>('contacts')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    status: 'lead' as Contact['status'],
    source: 'website' as Contact['source'],
    tags: [] as string[],
    notes: '',
  })

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        search === '' ||
        `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        contact.email.toLowerCase().includes(search.toLowerCase()) ||
        contact.company?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter

      // New Avatar tab: show only contacts with 'avatar_lead' tag
      if (activeTab === 'new_avatar') {
        return matchesSearch && contact.tags.includes('avatar_lead')
      }

      return matchesSearch && matchesStatus
    })
  }, [contacts, search, statusFilter, activeTab])

  // Count avatar leads for the tab badge
  const avatarLeadCount = useMemo(() => {
    return contacts.filter(c => c.tags.includes('avatar_lead')).length
  }, [contacts])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingContact) {
      updateContact(editingContact.id, formData)
    } else {
      addContact(formData)
    }
    resetForm()
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingContact(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      status: 'lead',
      source: 'website',
      tags: [],
      notes: '',
    })
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
      jobTitle: contact.jobTitle || '',
      status: contact.status,
      source: contact.source,
      tags: contact.tags,
      notes: contact.notes || '',
    })
    setShowForm(true)
  }

  const toggleTag = (tagValue: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagValue)
        ? prev.tags.filter(t => t !== tagValue)
        : [...prev.tags, tagValue],
    }))
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Contacts"
        subtitle={`${contacts.length} total contacts`}
        action={{
          label: 'Add Contact',
          onClick: () => setShowForm(true),
        }}
      />

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Tab Navigation: Contacts | New Avatar */}
        <div className="flex gap-1 border-b border-border pb-0">
          <button
            onClick={() => { setActiveTab('contacts'); setStatusFilter('all') }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'contacts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Contacts
          </button>
          <button
            onClick={() => setActiveTab('new_avatar')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'new_avatar'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserSearch className="w-4 h-4" />
            New Avatar
            {avatarLeadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                {avatarLeadCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'new_avatar' ? 'Search avatar leads...' : 'Search contacts...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {activeTab === 'contacts' && (
            <div className="flex gap-2">
              {['all', 'lead', 'prospect', 'customer', 'churned'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
        </div>

        {/* Contacts Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Contact</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Company</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Tags</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Source</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Created</th>
                    <th className="text-right p-4 font-medium text-muted-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">
                              {getInitials(`${contact.firstName} ${contact.lastName}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {contact.firstName} {contact.lastName}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {contact.company && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{contact.company}</p>
                              {contact.jobTitle && (
                                <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant={statusColors[contact.status]}>
                          {contact.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                tagColorMap[tag] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{sourceLabels[contact.source]}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(contact.createdAt)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(contact)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteContact(contact.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredContacts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  {activeTab === 'new_avatar'
                    ? 'No avatar leads found. Sam will populate this tab when avatar searches are run.'
                    : 'No contacts found'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSV Import Modal */}
      {showImport && (
        <CSVImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {}}
        />
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">First Name *</label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Last Name *</label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Company</label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Job Title</label>
                    <Input
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Contact['status'] })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="lead">Lead</option>
                      <option value="prospect">Prospect</option>
                      <option value="customer">Customer</option>
                      <option value="churned">Churned</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Source</label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value as Contact['source'] })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="meta_ads">Meta Ads</option>
                      <option value="google_ads">Google Ads</option>
                      <option value="organic">Organic</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* AI-Managed Tags */}
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" />
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AI_TAGS.map((tag) => {
                      const isActive = formData.tags.includes(tag.value)
                      return (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => toggleTag(tag.value)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                            isActive
                              ? `${tag.color} border-current`
                              : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                          }`}
                        >
                          {isActive && <span className="mr-1">&#10003;</span>}
                          {tag.label}
                        </button>
                      )
                    })}
                  </div>
                  {/* Custom tag input */}
                  <div className="mt-2">
                    <Input
                      placeholder="Add custom tag and press Enter..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const value = (e.target as HTMLInputElement).value.trim()
                          if (value && !formData.tags.includes(value)) {
                            setFormData(prev => ({ ...prev, tags: [...prev.tags, value] }));
                            (e.target as HTMLInputElement).value = ''
                          }
                        }
                      }}
                      className="text-sm"
                    />
                  </div>
                  {/* Display current tags */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            tagColorMap[tag] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className="hover:opacity-70"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingContact ? 'Save Changes' : 'Add Contact'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
