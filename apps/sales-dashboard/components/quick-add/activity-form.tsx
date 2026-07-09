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

import { createActivity, type ActionState } from '@/lib/actions'
import type { ActivityType } from '@/types/database'

const initialState: ActionState = {}

export interface ActivityFormDefaultValues {
  subject?: string
  type?: ActivityType
  notes?: string | null
  due_at?: string | null
  lead_id?: string | null
}

interface ActivityFormProps {
  leadOptions: { id: string; name: string; company: string | null }[]
  onSuccess: () => void
  defaultValues?: ActivityFormDefaultValues
}

export function ActivityForm({ leadOptions, onSuccess, defaultValues }: ActivityFormProps) {
  const [state, formAction, pending] = useActionState(createActivity, initialState)

  useEffect(() => {
    if (state.success) onSuccess()
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="activity-subject">Subject</Label>
        <Input
          id="activity-subject"
          name="subject"
          placeholder="Follow up on pricing"
          defaultValue={defaultValues?.subject}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="activity-type">Type</Label>
        <Select name="type" defaultValue={defaultValues?.type ?? 'follow_up'}>
          <SelectTrigger id="activity-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="follow_up">Follow-up</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="note">Note</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {leadOptions.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="activity-lead">Lead</Label>
          <Select name="lead_id" defaultValue={defaultValues?.lead_id ?? undefined}>
            <SelectTrigger id="activity-lead">
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="activity-due-at">Due</Label>
        <Input
          id="activity-due-at"
          name="due_at"
          type="datetime-local"
          defaultValue={defaultValues?.due_at ?? undefined}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="activity-notes">Notes</Label>
        <TextArea id="activity-notes" name="notes" rows={3} defaultValue={defaultValues?.notes ?? undefined} />
      </div>
      {state.error && <p className="text-sm text-destructive-600">{state.error}</p>}
      <Button type="submit" block loading={pending}>
        Add activity
      </Button>
    </form>
  )
}
