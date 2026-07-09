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

import { createLead, type ActionState } from '@/lib/actions'
import type { LeadStatus } from '@/types/database'

const initialState: ActionState = {}

export interface LeadFormDefaultValues {
  name?: string
  company?: string | null
  email?: string | null
  phone?: string | null
  source?: string | null
  status?: LeadStatus
  estimated_value?: number | null
  notes?: string | null
}

interface LeadFormProps {
  onSuccess: () => void
  defaultValues?: LeadFormDefaultValues
}

export function LeadForm({ onSuccess, defaultValues }: LeadFormProps) {
  const [state, formAction, pending] = useActionState(createLead, initialState)

  useEffect(() => {
    if (state.success) onSuccess()
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="lead-name">Name</Label>
        <Input
          id="lead-name"
          name="name"
          placeholder="Jamie Rivera"
          defaultValue={defaultValues?.name}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lead-company">Company</Label>
        <Input
          id="lead-company"
          name="company"
          placeholder="Acme Inc."
          defaultValue={defaultValues?.company ?? undefined}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="lead-email">Email</Label>
          <Input
            id="lead-email"
            name="email"
            type="email"
            inputMode="email"
            defaultValue={defaultValues?.email ?? undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lead-phone">Phone</Label>
          <Input
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={defaultValues?.phone ?? undefined}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lead-source">Source</Label>
        <Input
          id="lead-source"
          name="source"
          placeholder="Referral, inbound, event..."
          defaultValue={defaultValues?.source ?? undefined}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lead-estimated-value">Estimated value (USD)</Label>
        <Input
          id="lead-estimated-value"
          name="estimated_value"
          type="number"
          min="0"
          step="0.01"
          defaultValue={defaultValues?.estimated_value ?? undefined}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lead-status">Status</Label>
        <Select name="status" defaultValue={defaultValues?.status ?? 'new'}>
          <SelectTrigger id="lead-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="unqualified">Unqualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lead-notes">Notes</Label>
        <TextArea id="lead-notes" name="notes" rows={3} defaultValue={defaultValues?.notes ?? undefined} />
      </div>
      {state.error && <p className="text-sm text-destructive-600">{state.error}</p>}
      <Button type="submit" block loading={pending}>
        Add lead
      </Button>
    </form>
  )
}
