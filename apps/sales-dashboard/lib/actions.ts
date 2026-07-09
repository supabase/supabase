'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type { ActivityType, LeadStatus, QuoteStage } from '@/types/database'

function numberOrNull(value: FormDataEntryValue | null) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function stringOrNull(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? '').trim()
  return trimmed.length > 0 ? trimmed : null
}

export type ActionState = { error?: string; success?: boolean }

export async function createLead(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = stringOrNull(formData.get('name'))
  if (!name) return { error: 'Name is required.' }

  const supabase = await createClient()
  const { error } = await supabase.from('leads').insert({
    name,
    company: stringOrNull(formData.get('company')),
    email: stringOrNull(formData.get('email')),
    phone: stringOrNull(formData.get('phone')),
    source: stringOrNull(formData.get('source')),
    status: (stringOrNull(formData.get('status')) as LeadStatus) ?? 'new',
    estimated_value: numberOrNull(formData.get('estimated_value')),
    notes: stringOrNull(formData.get('notes')),
  })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/leads')
  return { success: true }
}

export async function createQuote(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const title = stringOrNull(formData.get('title'))
  if (!title) return { error: 'Title is required.' }

  const stage = (stringOrNull(formData.get('stage')) as QuoteStage) ?? 'draft'
  const leadId = stringOrNull(formData.get('lead_id'))

  const supabase = await createClient()
  const { error } = await supabase.from('quotes').insert({
    title,
    lead_id: leadId,
    amount: numberOrNull(formData.get('amount')) ?? 0,
    stage,
    sent_at: stage === 'sent' || stage === 'viewed' ? new Date().toISOString() : null,
    valid_until: stringOrNull(formData.get('valid_until')),
    notes: stringOrNull(formData.get('notes')),
  })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/quotes')
  return { success: true }
}

export async function createActivity(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const subject = stringOrNull(formData.get('subject'))
  if (!subject) return { error: 'Subject is required.' }

  const dueAt = stringOrNull(formData.get('due_at'))
  const leadId = stringOrNull(formData.get('lead_id'))
  const quoteId = stringOrNull(formData.get('quote_id'))

  const supabase = await createClient()
  const { error } = await supabase.from('activities').insert({
    subject,
    lead_id: leadId,
    quote_id: quoteId,
    type: (stringOrNull(formData.get('type')) as ActivityType) ?? 'note',
    notes: stringOrNull(formData.get('notes')),
    due_at: dueAt ? new Date(dueAt).toISOString() : null,
  })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/activities')
  return { success: true }
}

export async function updateQuoteStage(id: string, stage: QuoteStage) {
  const supabase = await createClient()
  const decidedStages: QuoteStage[] = ['accepted', 'declined', 'expired']

  const { error } = await supabase
    .from('quotes')
    .update({
      stage,
      sent_at: stage === 'sent' ? new Date().toISOString() : undefined,
      decided_at: decidedStages.includes(stage) ? new Date().toISOString() : undefined,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/quotes')
}

export async function completeActivity(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('activities')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/activities')
}
