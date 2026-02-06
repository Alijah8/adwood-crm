import { useState, useMemo } from 'react'
import { Header } from '../components/layout/Header'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useCRMStore } from '../store'
import { formatCurrency, formatDate } from '../lib/utils'
import type { Deal } from '../types'
import { X, Calendar, DollarSign } from 'lucide-react'

const stages = [
  { id: 'lead', name: 'Lead', color: 'bg-slate-500' },
  { id: 'qualified', name: 'Qualified', color: 'bg-blue-500' },
  { id: 'proposal', name: 'Proposal', color: 'bg-yellow-500' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-500' },
  { id: 'won', name: 'Won', color: 'bg-green-500' },
  { id: 'lost', name: 'Lost', color: 'bg-red-500' },
] as const

export function Deals() {
  const { deals, contacts, addDeal, updateDeal, deleteDeal } = useCRMStore()
  const [showForm, setShowForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    value: 0,
    stage: 'lead' as Deal['stage'],
    contactId: '',
    probability: 20,
    expectedCloseDate: '',
    notes: '',
  })

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {}
    stages.forEach((stage) => {
      grouped[stage.id] = deals.filter((d) => d.stage === stage.id)
    })
    return grouped
  }, [deals])

  const stageValues = useMemo(() => {
    const values: Record<string, number> = {}
    stages.forEach((stage) => {
      values[stage.id] = dealsByStage[stage.id].reduce((sum, d) => sum + d.value, 0)
    })
    return values
  }, [dealsByStage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate) : undefined,
    }
    if (editingDeal) {
      updateDeal(editingDeal.id, data)
    } else {
      addDeal(data)
    }
    resetForm()
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingDeal(null)
    setFormData({
      title: '',
      value: 0,
      stage: 'lead',
      contactId: '',
      probability: 20,
      expectedCloseDate: '',
      notes: '',
    })
  }

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal)
    setFormData({
      title: deal.title,
      value: deal.value,
      stage: deal.stage,
      contactId: deal.contactId,
      probability: deal.probability,
      expectedCloseDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
        : '',
      notes: deal.notes || '',
    })
    setShowForm(true)
  }

  const handleStageChange = (dealId: string, newStage: Deal['stage']) => {
    const probabilities: Record<string, number> = {
      lead: 10,
      qualified: 30,
      proposal: 50,
      negotiation: 70,
      won: 100,
      lost: 0,
    }
    updateDeal(dealId, { stage: newStage, probability: probabilities[newStage] })
  }

  const getContactName = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId)
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Deals"
        subtitle={`${deals.length} total deals • ${formatCurrency(deals.reduce((s, d) => s + d.value, 0))} pipeline`}
        action={{
          label: 'Add Deal',
          onClick: () => setShowForm(true),
        }}
      />

      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max h-full">
          {stages.map((stage) => (
            <div key={stage.id} className="w-72 flex flex-col">
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <span className="font-medium">{stage.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {dealsByStage[stage.id].length}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(stageValues[stage.id])}
                </span>
              </div>

              {/* Deal Cards */}
              <div className="flex-1 space-y-3 min-h-[200px]">
                {dealsByStage[stage.id].map((deal) => (
                  <Card
                    key={deal.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleEdit(deal)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm line-clamp-2">{deal.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mr-2 -mt-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteDeal(deal.id)
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {getContactName(deal.contactId)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          {formatCurrency(deal.value)}
                        </div>
                        {deal.expectedCloseDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {formatDate(deal.expectedCloseDate)}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex-1 bg-muted rounded-full h-1.5 mr-2">
                          <div
                            className={`h-1.5 rounded-full ${stage.color}`}
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {deal.probability}%
                        </span>
                      </div>
                      {/* Stage Selector */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <select
                          value={deal.stage}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleStageChange(deal.id, e.target.value as Deal['stage'])
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-xs bg-muted rounded px-2 py-1 border-0"
                        >
                          {stages.map((s) => (
                            <option key={s.id} value={s.id}>
                              Move to {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {dealsByStage[stage.id].length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                    No deals
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">
                {editingDeal ? 'Edit Deal' : 'Add Deal'}
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 p-6">
                <div>
                  <label className="text-sm font-medium mb-1 block">Deal Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Value *</label>
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Probability %</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.probability}
                      onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Stage</label>
                    <select
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value as Deal['stage'] })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
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
                      <option value="">Select contact...</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Expected Close Date</label>
                  <Input
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  />
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
                  {editingDeal ? 'Save Changes' : 'Add Deal'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
