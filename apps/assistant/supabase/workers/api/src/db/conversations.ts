import type { SupabaseClient } from '@supabase/supabase-js'
import type { UIMessage } from 'ai'

import { dedupeMessagesById } from './conversations.utils'

export type ConversationRow = {
  id: string
  user_id: string
  project_ref: string
  org_slug: string
  name: string
  model: string | null
  support_metadata: unknown
  branched_from: unknown
  surface: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type MessageRow = {
  id: string
  conversation_id: string
  user_id: string
  role: UIMessage['role']
  parts: UIMessage['parts']
  metadata: UIMessage['metadata']
  seq: number
  created_at: string
}

export type ConversationWithMessages = ConversationRow & {
  messages: MessageRow[]
}

export type CreateConversationInput = {
  id?: string
  projectRef: string
  orgSlug: string
  name?: string
  model?: string
  branchedFrom?: unknown
}

export type FeedbackInput = {
  conversationId: string
  messageId: string
  userId: string
  rating: 'positive' | 'negative'
  reason?: string
  braintrustSpanId?: string
}

export function messageToUIMessage(row: MessageRow): UIMessage {
  return {
    id: row.id,
    role: row.role,
    parts: row.parts,
    metadata: row.metadata,
  }
}

export async function listConversations(
  supabase: SupabaseClient,
  projectRef: string
): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      'id, user_id, project_ref, org_slug, name, model, support_metadata, branched_from, surface, created_at, updated_at, deleted_at'
    )
    .eq('project_ref', projectRef)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to list conversations: ${error.message}`)
  }

  return (data ?? []) as ConversationRow[]
}

export async function createConversation(
  supabase: SupabaseClient,
  userId: string,
  input: CreateConversationInput
): Promise<ConversationRow> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      ...(input.id ? { id: input.id } : {}),
      user_id: userId,
      project_ref: input.projectRef,
      org_slug: input.orgSlug,
      name: input.name ?? 'Untitled',
      model: input.model ?? null,
      branched_from: input.branchedFrom ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create conversation: ${error?.message ?? 'empty response'}`)
  }

  return data as ConversationRow
}

export async function getConversation(
  supabase: SupabaseClient,
  id: string
): Promise<ConversationWithMessages | null> {
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (conversationError) {
    throw new Error(`Failed to load conversation: ${conversationError.message}`)
  }
  if (!conversation) return null

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('id, conversation_id, user_id, role, parts, metadata, seq, created_at')
    .eq('conversation_id', id)
    .order('seq', { ascending: true })

  if (messagesError) {
    throw new Error(`Failed to load messages: ${messagesError.message}`)
  }

  return {
    ...(conversation as ConversationRow),
    messages: (messages ?? []) as MessageRow[],
  }
}

export async function updateConversation(
  supabase: SupabaseClient,
  id: string,
  patch: { name?: string; model?: string }
): Promise<ConversationRow> {
  const { data, error } = await supabase
    .from('conversations')
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.model !== undefined ? { model: patch.model } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to update conversation: ${error?.message ?? 'not found'}`)
  }

  return data as ConversationRow
}

export async function softDeleteConversation(supabase: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await supabase
    .from('conversations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to delete conversation: ${error.message}`)
  }
  if (!data) {
    throw new Error('Conversation not found')
  }
}

function messageRow(conversationId: string, userId: string, message: UIMessage) {
  return {
    id: message.id,
    conversation_id: conversationId,
    user_id: userId,
    role: message.role,
    parts: message.parts,
    metadata: message.metadata ?? null,
  }
}

export async function upsertMessage(
  supabase: SupabaseClient,
  input: {
    conversationId: string
    userId: string
    message: UIMessage
  }
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .upsert(messageRow(input.conversationId, input.userId, input.message), {
      onConflict: 'conversation_id,id',
    })
  if (error) {
    throw new Error(`Failed to upsert message: ${error.message}`)
  }

  const { error: touchError } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', input.conversationId)

  if (touchError) {
    throw new Error(`Failed to touch conversation: ${touchError.message}`)
  }
}

export async function upsertMessages(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
  messages: UIMessage[]
): Promise<void> {
  const unique = dedupeMessagesById(messages)
  if (unique.length === 0) return

  const { error } = await supabase.from('messages').upsert(
    unique.map((message) => messageRow(conversationId, userId, message)),
    { onConflict: 'conversation_id,id' }
  )

  if (error) {
    throw new Error(`Failed to upsert messages: ${error.message}`)
  }

  const { error: touchError } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (touchError) {
    throw new Error(`Failed to touch conversation: ${touchError.message}`)
  }
}

export async function insertFeedback(
  supabase: SupabaseClient,
  input: FeedbackInput
): Promise<void> {
  const { error } = await supabase.from('message_feedback').insert({
    conversation_id: input.conversationId,
    message_id: input.messageId,
    user_id: input.userId,
    rating: input.rating,
    reason: input.reason ?? null,
    braintrust_span_id: input.braintrustSpanId ?? null,
  })

  if (error) {
    throw new Error(`Failed to insert feedback: ${error.message}`)
  }
}
