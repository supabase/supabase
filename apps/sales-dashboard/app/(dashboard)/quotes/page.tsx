import { Badge, Button, Card, CardContent } from 'ui'

import { updateQuoteStage } from '@/lib/actions'
import { createClient } from '@/lib/supabase/server'
import type { QuoteStage } from '@/types/database'

const CURRENCY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const STAGE_VARIANT: Record<QuoteStage, 'default' | 'secondary' | 'warning' | 'destructive' | 'success'> = {
  draft: 'secondary',
  sent: 'default',
  viewed: 'default',
  accepted: 'success',
  declined: 'destructive',
  expired: 'warning',
}

const NEXT_STAGE_ACTIONS: Partial<Record<QuoteStage, { label: string; stage: QuoteStage }[]>> = {
  draft: [{ label: 'Mark sent', stage: 'sent' }],
  sent: [
    { label: 'Accept', stage: 'accepted' },
    { label: 'Decline', stage: 'declined' },
  ],
  viewed: [
    { label: 'Accept', stage: 'accepted' },
    { label: 'Decline', stage: 'declined' },
  ],
}

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, leads(name, company)')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-medium text-foreground">Quotes</h1>

      {(!quotes || quotes.length === 0) && (
        <p className="text-sm text-foreground-light">
          No quotes yet. Tap + to add your first quote.
        </p>
      )}

      {quotes?.map((quote) => (
        <Card key={quote.id}>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{quote.title}</span>
                {quote.leads && (
                  <span className="text-xs text-foreground-light">
                    {quote.leads.name}
                    {quote.leads.company ? ` · ${quote.leads.company}` : ''}
                  </span>
                )}
              </div>
              <Badge variant={STAGE_VARIANT[quote.stage]}>{quote.stage}</Badge>
            </div>
            <span className="text-lg font-medium text-foreground">
              {CURRENCY.format(quote.amount)}
            </span>
            {quote.notes && <p className="text-xs text-foreground-light">{quote.notes}</p>}
            {NEXT_STAGE_ACTIONS[quote.stage] && (
              <div className="flex gap-2 pt-1">
                {NEXT_STAGE_ACTIONS[quote.stage]!.map(({ label, stage }) => (
                  <form key={stage} action={updateQuoteStage.bind(null, quote.id, stage)}>
                    <Button type="submit" size="tiny" variant="outline">
                      {label}
                    </Button>
                  </form>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
