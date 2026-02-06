import { useMemo } from 'react'
import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { useCRMStore } from '../store'
import { formatCurrency, formatRelativeTime, getInitials } from '../lib/utils'
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

const revenueData = [
  { month: 'Sep', revenue: 45000 },
  { month: 'Oct', revenue: 52000 },
  { month: 'Nov', revenue: 48000 },
  { month: 'Dec', revenue: 61000 },
  { month: 'Jan', revenue: 85000 },
  { month: 'Feb', revenue: 92000 },
]

const dealsData = [
  { stage: 'Lead', count: 12 },
  { stage: 'Qualified', count: 8 },
  { stage: 'Proposal', count: 5 },
  { stage: 'Negotiation', count: 3 },
  { stage: 'Won', count: 7 },
]

export function Dashboard() {
  const { contacts, deals, tasks, events, payments } = useCRMStore()

  const metrics = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const newContactsThisMonth = contacts.filter(c => {
      const d = new Date(c.createdAt)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    }).length

    const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage))
    const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0)

    const wonDeals = deals.filter(d => d.stage === 'won')
    const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0)

    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false
      return new Date(t.dueDate) < now
    }).length

    const upcomingEvents = events.filter(e => {
      const start = new Date(e.startTime)
      return start > now && start < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }).length

    const completedPayments = payments.filter(p => p.status === 'completed')
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0)

    return {
      totalContacts: contacts.length,
      newContactsThisMonth,
      activeDeals: activeDeals.length,
      pipelineValue,
      wonDeals: wonDeals.length,
      wonValue,
      overdueTasks,
      upcomingEvents,
      totalRevenue,
    }
  }, [contacts, deals, tasks, events, payments])

  const recentContacts = useMemo(() => {
    return [...contacts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [contacts])

  const upcomingTasks = useMemo(() => {
    return [...tasks]
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
      .slice(0, 5)
  }, [tasks])

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle="Welcome back, Alijah" />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Contacts
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalContacts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 inline-flex items-center">
                  <ArrowUpRight className="w-3 h-3" />
                  {metrics.newContactsThisMonth}
                </span>
                {' '}new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pipeline Value
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.pipelineValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.activeDeals} active deals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 inline-flex items-center">
                  <ArrowUpRight className="w-3 h-3" />
                  12%
                </span>
                {' '}vs last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming
              </CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.upcomingEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                events this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deals by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="stage" type="category" className="text-xs" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">
                        {getInitials(`${contact.firstName} ${contact.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.company || contact.email}
                      </p>
                    </div>
                    <Badge
                      variant={
                        contact.status === 'customer'
                          ? 'success'
                          : contact.status === 'prospect'
                          ? 'info'
                          : 'secondary'
                      }
                    >
                      {contact.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500'
                          : task.priority === 'high' || task.priority === 'urgent'
                          ? 'border-destructive'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(task.dueDate)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        task.priority === 'urgent'
                          ? 'destructive'
                          : task.priority === 'high'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
                {upcomingTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming tasks
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
