import { useState, useMemo } from 'react'
import { Header } from '../components/layout/Header'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useCRMStore } from '../store'
import { formatRelativeTime, getInitials } from '../lib/utils'
import type { Communication } from '../types'
import { Mail, MessageSquare, Phone, FileText, Send, X, Inbox, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

const typeConfig = {
  email: { icon: Mail, label: 'Email' },
  sms: { icon: MessageSquare, label: 'SMS' },
  call: { icon: Phone, label: 'Call' },
  meeting: { icon: Phone, label: 'Meeting' },
  note: { icon: FileText, label: 'Note' },
}

export function Communications() {
  const { communications, contacts, addCommunication } = useCRMStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'email' as Communication['type'],
    direction: 'outbound' as Communication['direction'],
    contactId: '',
    subject: '',
    body: '',
  })

  const sortedComms = useMemo(() => {
    return [...communications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [communications])

  const getContact = (id: string) => contacts.find((c) => c.id === id)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addCommunication({
      ...formData,
      status: 'sent',
      sentAt: new Date(),
    })
    setShowForm(false)
    setFormData({
      type: 'email',
      direction: 'outbound',
      contactId: '',
      subject: '',
      body: '',
    })
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Communications"
        subtitle="Track all your conversations"
        action={{
          label: 'New Message',
          onClick: () => setShowForm(true),
        }}
      />

      <div className="flex-1 p-6 overflow-auto">
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="call">Calls</TabsTrigger>
            <TabsTrigger value="note">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <Card>
              <CardContent className="p-0">
                {sortedComms.length > 0 ? (
                  <div className="divide-y divide-border">
                    {sortedComms.map((comm) => {
                      const contact = getContact(comm.contactId)
                      const config = typeConfig[comm.type]
                      const Icon = config.icon
                      return (
                        <div key={comm.id} className="flex items-start gap-4 p-4 hover:bg-muted/50">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {contact ? getInitials(`${contact.firstName} ${contact.lastName}`) : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                <Icon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                              {comm.direction === 'inbound' ? (
                                <ArrowDownLeft className="w-3 h-3 text-green-500" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                            {comm.subject && (
                              <p className="text-sm font-medium">{comm.subject}</p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">{comm.body}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatRelativeTime(comm.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No communications yet</p>
                    <p className="text-sm">Start by sending a message</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {['email', 'sms', 'call', 'note'].map((type) => (
            <TabsContent key={type} value={type} className="mt-0">
              <Card>
                <CardContent className="p-0">
                  {sortedComms.filter((c) => c.type === type).length > 0 ? (
                    <div className="divide-y divide-border">
                      {sortedComms
                        .filter((c) => c.type === type)
                        .map((comm) => {
                          const contact = getContact(comm.contactId)
                          return (
                            <div key={comm.id} className="flex items-start gap-4 p-4 hover:bg-muted/50">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>
                                  {contact ? getInitials(`${contact.firstName} ${contact.lastName}`) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">
                                    {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'}
                                  </span>
                                </div>
                                {comm.subject && (
                                  <p className="text-sm font-medium">{comm.subject}</p>
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-2">{comm.body}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatRelativeTime(comm.createdAt)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No {type}s yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Compose Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">New Message</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Communication['type'] })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="call">Call Log</option>
                      <option value="note">Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Contact *</label>
                    <select
                      value={formData.contactId}
                      onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select...</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {formData.type === 'email' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Subject</label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-1 block">Message *</label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
