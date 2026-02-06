import { useState, useRef } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useCRMStore } from '../store'
import { generateId } from '../lib/utils'
import type { Contact } from '../types'
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface CSVRow {
  [key: string]: string
}

interface MappedContact {
  original: CSVRow
  mapped: Contact
  warnings: string[]
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  // Parse header
  const headers = parseCSVLine(lines[0])
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: CSVRow = {}
    headers.forEach((header, idx) => {
      row[header.trim()] = (values[idx] || '').trim()
    })
    rows.push(row)
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date()

  // Try ISO format first (e.g., "2025-10-22T09:46:36-05:00")
  const isoDate = new Date(dateStr)
  if (!isNaN(isoDate.getTime())) return isoDate

  // Try "Jan 28 2026 09:52 PM" format
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) return parsed

  return new Date()
}

function mapGoHighLevelContact(row: CSVRow): MappedContact {
  const warnings: string[] = []
  const now = new Date()

  const firstName = row['First Name'] || ''
  const lastName = row['Last Name'] || ''
  const email = row['Email'] || ''
  const phone = row['Phone'] || ''
  const created = row['Created'] || ''
  const lastActivity = row['Last Activity'] || ''
  const tagsStr = row['Tags'] || ''

  if (!firstName && !lastName) warnings.push('Missing name')
  if (!email) warnings.push('Missing email')

  // Parse tags
  const tags = tagsStr
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)

  // Determine status based on tags
  const hasInForce = tags.some(t => t.toLowerCase() === 'in-force')
  const status: Contact['status'] = hasInForce ? 'customer' : 'lead'

  const mapped: Contact = {
    id: generateId(),
    firstName: firstName || 'Unknown',
    lastName: lastName || 'Unknown',
    email: email || `no-email-${generateId()}@placeholder.com`,
    phone: phone || undefined,
    status,
    source: 'other',
    tags,
    createdAt: parseDate(created),
    updatedAt: now,
    lastContactedAt: lastActivity ? parseDate(lastActivity) : undefined,
  }

  return { original: row, mapped, warnings }
}

interface CSVImportModalProps {
  onClose: () => void
  onImported: () => void
}

export function CSVImportModal({ onClose, onImported }: CSVImportModalProps) {
  const { importContacts, contacts } = useCRMStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [mappedContacts, setMappedContacts] = useState<MappedContact[]>([])
  const [skippedDuplicates, setSkippedDuplicates] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const rows = parseCSV(text)

        if (rows.length === 0) {
          setError('No data found in CSV file')
          return
        }

        // Map all rows to contacts
        const mapped = rows.map(mapGoHighLevelContact)

        // Check for duplicates against existing contacts
        const existingEmails = new Set(contacts.map(c => c.email.toLowerCase()))
        const duplicates: string[] = []
        const unique: MappedContact[] = []

        for (const mc of mapped) {
          const email = mc.mapped.email.toLowerCase()
          if (existingEmails.has(email)) {
            duplicates.push(`${mc.mapped.firstName} ${mc.mapped.lastName} (${mc.mapped.email})`)
          } else {
            unique.push(mc)
            existingEmails.add(email) // prevent duplicates within the CSV itself
          }
        }

        setMappedContacts(unique)
        setSkippedDuplicates(duplicates)
        setStep('preview')
      } catch {
        setError('Failed to parse CSV file. Please check the format.')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    setImporting(true)
    try {
      const contactsToImport = mappedContacts.map(mc => mc.mapped)
      importContacts(contactsToImport)
      setImportedCount(contactsToImport.length)
      setStep('done')
      onImported()
    } catch {
      setError('Failed to import contacts')
    } finally {
      setImporting(false)
    }
  }

  const contactsWithWarnings = mappedContacts.filter(mc => mc.warnings.length > 0)
  const customerCount = mappedContacts.filter(mc => mc.mapped.status === 'customer').length
  const leadCount = mappedContacts.filter(mc => mc.mapped.status === 'lead').length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            {step === 'upload' && 'Import Contacts from CSV'}
            {step === 'preview' && 'Review Import'}
            {step === 'done' && 'Import Complete'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <CardContent className="p-6">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a CSV file exported from GoHighLevel or any CRM. The importer will
                automatically map columns and detect duplicates.
              </p>

              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium mb-1">Click to upload CSV</p>
                <p className="text-sm text-muted-foreground">
                  Supports GoHighLevel export format
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Supported columns:</p>
                <p className="text-xs text-muted-foreground">
                  First Name, Last Name, Phone, Email, Created, Last Activity, Tags
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Contacts with an "in-force" tag will be imported as <strong>Customers</strong>.
                  All others will be imported as <strong>Leads</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{mappedContacts.length}</p>
                  <p className="text-sm text-muted-foreground">Contacts to import</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex gap-2 mb-1">
                    <Badge variant="success">{customerCount} customers</Badge>
                    <Badge variant="secondary">{leadCount} leads</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Status breakdown</p>
                </div>
              </div>

              {/* Duplicates warning */}
              {skippedDuplicates.length > 0 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <strong>{skippedDuplicates.length} duplicate(s) will be skipped</strong>
                  </div>
                  <ul className="ml-6 space-y-0.5 text-xs">
                    {skippedDuplicates.slice(0, 5).map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                    {skippedDuplicates.length > 5 && (
                      <li>...and {skippedDuplicates.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {contactsWithWarnings.length > 0 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <strong>{contactsWithWarnings.length} contact(s) have warnings</strong>
                  </div>
                </div>
              )}

              {/* Preview table */}
              <div className="border border-border rounded-lg overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">Email</th>
                      <th className="text-left p-2 font-medium">Phone</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedContacts.map((mc, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-2">
                          {mc.mapped.firstName} {mc.mapped.lastName}
                          {mc.warnings.length > 0 && (
                            <AlertCircle className="w-3 h-3 text-yellow-500 inline ml-1" />
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground">{mc.mapped.email}</td>
                        <td className="p-2 text-muted-foreground">{mc.mapped.phone || '—'}</td>
                        <td className="p-2">
                          <Badge variant={mc.mapped.status === 'customer' ? 'success' : 'secondary'}>
                            {mc.mapped.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {mc.mapped.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {mc.mapped.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{mc.mapped.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setStep('upload'); setMappedContacts([]); setSkippedDuplicates([]) }}>
                  Back
                </Button>
                <Button onClick={handleImport} disabled={importing || mappedContacts.length === 0}>
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    `Import ${mappedContacts.length} Contacts`
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Done Step */}
          {step === 'done' && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <h3 className="text-xl font-semibold mb-1">Import Successful</h3>
                <p className="text-muted-foreground">
                  {importedCount} contact{importedCount !== 1 ? 's' : ''} imported into your CRM.
                </p>
              </div>
              <Button onClick={onClose}>Done</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
