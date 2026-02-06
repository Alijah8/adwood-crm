import { Header } from '../components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useCRMStore } from '../store'
import { Download, Trash2, Moon, Sun, Database, Webhook, Mail, Globe } from 'lucide-react'

export function Settings() {
  const { darkMode, toggleDarkMode, clearAllData, contacts, deals, tasks, events, payments } = useCRMStore()

  const exportData = () => {
    const data = {
      contacts,
      deals,
      tasks,
      events,
      payments,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `adwood-crm-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Configure your CRM" />

      <div className="flex-1 p-6 space-y-6 overflow-auto max-w-3xl">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize how your CRM looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Button variant="outline" onClick={toggleDarkMode}>
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Management
            </CardTitle>
            <CardDescription>Export, import, or reset your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-muted-foreground">Download all your CRM data as JSON</p>
              </div>
              <Button variant="outline" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">Reset All Data</p>
                  <p className="text-sm text-muted-foreground">Permanently delete all CRM data</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure? This action cannot be undone.')) {
                      clearAllData()
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Integrations
            </CardTitle>
            <CardDescription>Connect with external services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <img src="https://n8n.io/favicon.ico" alt="n8n" className="w-6 h-6" onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }} />
                </div>
                <div>
                  <p className="font-medium">n8n Webhooks</p>
                  <p className="text-sm text-muted-foreground">Automate workflows with n8n</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium">Email (Gmail)</p>
                  <p className="text-sm text-muted-foreground">Send emails via Gmail API</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">Sync calendar events</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Configuration</CardTitle>
            <CardDescription>Configure webhook endpoints for automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">n8n Webhook URL</label>
              <Input placeholder="https://your-n8n-instance.com/webhook/..." />
              <p className="text-xs text-muted-foreground mt-1">
                Used for lead capture and automation triggers
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Meta Lead Ads Webhook</label>
              <Input placeholder="Webhook URL for Meta Lead Ads" disabled />
              <p className="text-xs text-muted-foreground mt-1">
                Configure in your Meta Business Manager
              </p>
            </div>
            <Button>Save Configuration</Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Adwood CRM</strong> v1.0.0</p>
              <p className="text-muted-foreground">
                A custom CRM built for Adwood Consulting. Designed to replace GoHighLevel
                with a more cost-effective, controllable solution.
              </p>
              <p className="text-muted-foreground">
                Built with React, TypeScript, Tailwind CSS, and deployed on Railway.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
