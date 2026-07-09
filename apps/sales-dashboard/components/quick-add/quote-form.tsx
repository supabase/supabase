'use client'

import { useActionState, useEffect } from 'react'
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextArea,
} from 'ui'

import { createQuote, type ActionState } from '@/lib/actions'

const initialState: ActionState = {}

interface QuoteFormProps {
  leadOptions: { id: string; name: string; company: string | null }[]
  onSuccess: () => void
}

export function QuoteForm({ leadOptions, onSuccess }: QuoteFormProps) {
  const [state, formAction, pending] = useActionState(createQuote, initialState)

  useEffect(() => {
    if (state.success) onSuccess()
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="quote-title">Title</Label>
        <Input id="quote-title" name="title" placeholder="Annual license renewal" required />
      </div>
      {leadOptions.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="quote-lead">Lead</Label>
          <Select name="lead_id">
            <SelectTrigger id="quote-lead">
              <SelectValue placeholder="Not linked to a lead" />
            </SelectTrigger>
            <SelectContent>
              {leadOptions.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.name}
                  {lead.company ? ` · ${lead.company}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="quote-amount">Amount (USD)</Label>
          <Input id="quote-amount" name="amount" type="number" min="0" step="0.01" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="quote-stage">Stage</Label>
          <Select name="stage" defaultValue="draft">
            <SelectTrigger id="quote-stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="quote-valid-until">Valid until</Label>
        <Input id="quote-valid-until" name="valid_until" type="date" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="quote-notes">Notes</Label>
        <TextArea id="quote-notes" name="notes" rows={3} />
      </div>
      {state.error && <p className="text-sm text-destructive-600">{state.error}</p>}
      <Button type="submit" block loading={pending}>
        Add quote
      </Button>
    </form>
  )
}
