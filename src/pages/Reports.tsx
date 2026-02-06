import { useMemo } from 'react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useCRMStore } from '../store'
import { formatCurrency } from '../lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function Reports() {
  const { contacts, deals, payments } = useCRMStore()

  const contactsByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    contacts.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [contacts])

  const contactsBySource = useMemo(() => {
    const counts: Record<string, number> = {}
    contacts.forEach((c) => {
      const source = c.source.replace('_', ' ')
      counts[source] = (counts[source] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [contacts])

  const dealsByStage = useMemo(() => {
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
    return stages.map((stage) => ({
      name: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: deals.filter((d) => d.stage === stage).length,
      value: deals.filter((d) => d.stage === stage).reduce((sum, d) => sum + d.value, 0),
    }))
  }, [deals])

  const monthlyRevenue = useMemo(() => {
    const months: Record<string, number> = {}
    payments
      .filter((p) => p.status === 'completed')
      .forEach((p) => {
        const date = new Date(p.paidAt || p.createdAt)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        months[key] = (months[key] || 0) + p.amount
      })
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, revenue]) => ({ month, revenue }))
  }, [payments])

  const stats = useMemo(() => {
    const wonDeals = deals.filter((d) => d.stage === 'won')
    const lostDeals = deals.filter((d) => d.stage === 'lost')
    const activeDeals = deals.filter((d) => !['won', 'lost'].includes(d.stage))
    const totalClosed = wonDeals.length + lostDeals.length
    const winRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0
    const avgDealValue = wonDeals.length > 0
      ? wonDeals.reduce((sum, d) => sum + d.value, 0) / wonDeals.length
      : 0

    return {
      totalContacts: contacts.length,
      totalDeals: deals.length,
      activeDeals: activeDeals.length,
      pipelineValue: activeDeals.reduce((sum, d) => sum + d.value, 0),
      wonDeals: wonDeals.length,
      wonValue: wonDeals.reduce((sum, d) => sum + d.value, 0),
      winRate,
      avgDealValue,
    }
  }, [contacts, deals])

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports" subtitle="Analytics and insights" />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Contacts</p>
              <p className="text-3xl font-bold">{stats.totalContacts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Pipeline Value</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.pipelineValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-3xl font-bold">{stats.winRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Avg Deal Value</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.avgDealValue)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacts by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contactsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {contactsByStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacts by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contactsBySource}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deals Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealsByStage} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                      }}
                      formatter={(value, name) =>
                        name === 'value' ? formatCurrency(value as number) : value
                      }
                    />
                    <Legend />
                    <Bar dataKey="count" name="Deals" fill="#8884d8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                      }}
                      formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
