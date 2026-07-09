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

const initialState: ActionState = {}

export function LeadForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState(createLead, initialState)

  useEffect(() => {
    if (state.success) onSuccess()
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="lead-name">Name</Label>
        <Input id="lead-name" name="name" placeholder="Jamie Rivera" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lead-company">Company</Label>
        <Input id="lead-company" name="company" placeholder="Acme Inc." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="lead-email">Email</Label>
          <Input id="lead-email" name="email" type="email" inputMode="email" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lead-phone">Phone</Label>
          <Input id="lead-phone" name="phone" type="tel" inputMode="tel" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lead-source">Source</Label>
        <Input id="lead-source" name="source" placeholder="Referral, inbound, event..." />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lead-status">Status</Label>
        <Select name="status" defaultValue="new">
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
        <TextArea id="lead-notes" name="notes" rows={3} />
      </div>
      {state.error && <p className="text-sm text-destructive-600">{state.error}</p>}
      <Button type="submit" block loading={pending}>
        Add lead
      </Button>
    </form>
  )
}
