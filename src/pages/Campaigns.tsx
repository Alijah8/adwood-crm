import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useCRMStore } from '../store'
import type { Campaign } from '../types'
import { Mail, MessageSquare, Share2, X, Play, Pause, BarChart3, Send, Users } from 'lucide-react'

const typeConfig = {
  email: { icon: Mail, label: 'Email' },
  sms: { icon: MessageSquare, label: 'SMS' },
  social: { icon: Share2, label: 'Social' },
}

const statusConfig = {
  draft: { color: 'secondary', label: 'Draft' },
  scheduled: { color: 'info', label: 'Scheduled' },
  active: { color: 'success', label: 'Active' },
  paused: { color: 'warning', label: 'Paused' },
  completed: { color: 'default', label: 'Completed' },
} as const

export function Campaigns() {
  const { campaigns, contacts, addCampaign, updateCampaign } = useCRMStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as Campaign['type'],
    targetAudience: [] as string[],
    content: '',
    scheduledAt: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addCampaign({
      ...formData,
      status: formData.scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : undefined,
      sentCount: 0,
    })
    setShowForm(false)
    setFormData({ name: '', type: 'email', targetAudience: [], content: '', scheduledAt: '' })
  }

  const toggleStatus = (id: string, currentStatus: Campaign['status']) => {
    if (currentStatus === 'active') {
      updateCampaign(id, { status: 'paused' })
    } else if (currentStatus === 'paused' || currentStatus === 'draft') {
      updateCampaign(id, { status: 'active' })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Campaigns"
        subtitle="Email & SMS marketing"
        action={{ label: 'New Campaign', onClick: () => setShowForm(true) }}
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaigns.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              <Play className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaigns.filter((c) => c.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle>
              <Send className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaigns.reduce((sum, c) => sum + c.sentCount, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Audience</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contacts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {campaigns.length > 0 ? (
              <div className="divide-y divide-border">
                {campaigns.map((campaign) => {
                  const TypeIcon = typeConfig[campaign.type].icon
                  return (
                    <div key={campaign.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{campaign.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={statusConfig[campaign.status].color}>
                              {statusConfig[campaign.status].label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {typeConfig[campaign.type].label}
                            </span>
                            {campaign.sentCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                • {campaign.sentCount} sent
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(campaign.status === 'draft' || campaign.status === 'paused') && (
                          <Button size="sm" onClick={() => toggleStatus(campaign.id, campaign.status)}>
                            <Play className="w-4 h-4 mr-1" />
                            Launch
                          </Button>
                        )}
                        {campaign.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(campaign.id, campaign.status)}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No campaigns yet</p>
                <p className="text-sm">Create your first marketing campaign</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Campaign Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">New Campaign</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 p-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Campaign Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Campaign['type'] })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="social">Social Media</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Schedule (optional)</label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Content *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Create Campaign</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
