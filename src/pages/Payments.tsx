import { useState, useMemo } from 'react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useCRMStore } from '../store'
import { formatCurrency, formatDate } from '../lib/utils'
import type { Payment } from '../types'
import { Clock, CheckCircle2, XCircle, X, TrendingUp, AlertCircle } from 'lucide-react'

const statusConfig = {
  pending: { color: 'warning', icon: Clock },
  completed: { color: 'success', icon: CheckCircle2 },
  failed: { color: 'destructive', icon: XCircle },
  refunded: { color: 'secondary', icon: AlertCircle },
} as const

export function Payments() {
  const { payments, contacts, addPayment, updatePayment } = useCRMStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    contactId: '',
    dealId: '',
    amount: 0,
    method: 'card' as Payment['method'],
    description: '',
    invoiceNumber: '',
    dueDate: '',
  })

  const stats = useMemo(() => {
    const completed = payments.filter((p) => p.status === 'completed')
    const pending = payments.filter((p) => p.status === 'pending')
    return {
      totalRevenue: completed.reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
      completedCount: completed.length,
      pendingCount: pending.length,
    }
  }, [payments])

  const getContactName = (id: string) => {
    const contact = contacts.find((c) => c.id === id)
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addPayment({
      ...formData,
      status: 'pending',
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
    })
    setShowForm(false)
    setFormData({
      contactId: '',
      dealId: '',
      amount: 0,
      method: 'card',
      description: '',
      invoiceNumber: '',
      dueDate: '',
    })
  }

  const markAsPaid = (id: string) => {
    updatePayment(id, { status: 'completed', paidAt: new Date() })
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Payments"
        subtitle="Track invoices and payments"
        action={{ label: 'Add Payment', onClick: () => setShowForm(true) }}
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">{stats.completedCount} payments received</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Clock className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingCount} awaiting payment</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Invoice</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Contact</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Description</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Amount</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Date</th>
                    <th className="text-right p-4 font-medium text-muted-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const StatusIcon = statusConfig[payment.status].icon
                    return (
                      <tr key={payment.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-4">
                          <span className="font-mono text-sm">{payment.invoiceNumber || '-'}</span>
                        </td>
                        <td className="p-4">{getContactName(payment.contactId)}</td>
                        <td className="p-4 max-w-[200px] truncate">{payment.description || '-'}</td>
                        <td className="p-4 font-semibold">{formatCurrency(payment.amount)}</td>
                        <td className="p-4">
                          <Badge variant={statusConfig[payment.status].color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {payment.paidAt ? formatDate(payment.paidAt) : payment.dueDate ? `Due ${formatDate(payment.dueDate)}` : '-'}
                        </td>
                        <td className="p-4 text-right">
                          {payment.status === 'pending' && (
                            <Button size="sm" onClick={() => markAsPaid(payment.id)}>
                              Mark Paid
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {payments.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No payments yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Add Payment</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 p-6">
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
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Amount *</label>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Invoice Number</label>
                    <Input
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Due Date</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Add Payment</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
