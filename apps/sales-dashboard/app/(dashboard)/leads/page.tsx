import { Badge, Card, CardContent } from 'ui'

import { createClient } from '@/lib/supabase/server'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'warning' | 'destructive' | 'success'> = {
  new: 'secondary',
  contacted: 'default',
  qualified: 'warning',
  unqualified: 'destructive',
  converted: 'success',
}

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-medium text-foreground">Leads</h1>

      {(!leads || leads.length === 0) && (
        <p className="text-sm text-foreground-light">
          No leads yet. Tap + to add your first lead.
        </p>
      )}

      {leads?.map((lead) => (
        <Card key={lead.id}>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{lead.name}</span>
                {lead.company && <span className="text-xs text-foreground-light">{lead.company}</span>}
              </div>
              <Badge variant={STATUS_VARIANT[lead.status] ?? 'default'}>{lead.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-light">
              {lead.email && <span>{lead.email}</span>}
              {lead.phone && <span>{lead.phone}</span>}
              {lead.estimated_value !== null && (
                <span>
                  Est. value:{' '}
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                    lead.estimated_value
                  )}
                </span>
              )}
            </div>
            {lead.notes && <p className="text-xs text-foreground-light">{lead.notes}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
