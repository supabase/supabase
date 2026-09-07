import type { SupabaseClient } from '@supabase/supabase-js'
import type { UIMessage } from 'ai'
import type { PoolClient } from 'pg'

import { HttpError } from '../http/errors'
import type { Database } from './database.types'
import { canRespondToAssistantApproval, reconcileMessages } from './history'
import { adminQuery, adminTransaction } from './postgres'
import { assistantSessionStore, withSessionStoreErrors } from './session-store'

export type ConversationRow = Database['public']['Tables']['conversations']['Row']
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
  hasMore: boolean
}
export function messageToUIMessage(row: MessageRow): UIMessage {
  return {
    id: row.id,
    role: row.role,
    parts: row.parts,
    ...(row.metadata ? { metadata: row.metadata } : {}),
  }
}

export async function listConversations(supabase: SupabaseClient<Database>, projectRef: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('project_ref', projectRef)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data ?? []
}

export async function getConversation(
  supabase: SupabaseClient<Database>,
  id: string,
  before?: number
): Promise<ConversationWithMessages | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('seq', { ascending: false })
    .limit(101)
  if (before !== undefined) query = query.lt('seq', before)
  const { data: messages, error: messagesError } = await query
  if (messagesError) throw messagesError
  return {
    ...data,
    revision: Number(data.revision),
    messages: (messages ?? []).slice(0, 100).reverse(),
    hasMore: (messages?.length ?? 0) > 100,
  } as ConversationWithMessages
}

async function lockConversation(
  client: PoolClient,
  id: string,
  userId: string,
  revision?: number,
  allowActive = false
) {
  const { rows } = await client.query<ConversationRow>(
    `select * from public.conversations
    where id=$1 and user_id=$2 and deleted_at is null for update`,
    [id, userId]
  )
  const row = rows[0]
  if (!row) throw new HttpError(404, 'not_found', 'Conversation not found.')
  if (revision !== undefined && Number(row.revision) !== revision) {
    throw new HttpError(409, 'conflict', 'This conversation changed. Reload it before continuing.')
  }
  if (
    !allowActive &&
    row.active_request_id &&
    row.active_since &&
    Date.parse(row.active_since) > Date.now() - 150_000
  ) {
    throw new HttpError(409, 'conflict', 'A response is already running. Wait for it to finish.')
  }
  return row
}

async function writeMessages(
  client: PoolClient,
  id: string,
  userId: string,
  messages: UIMessage[]
) {
  for (const message of messages) {
    const saved = await client.query(
      `insert into public.messages(id, conversation_id, user_id, role, parts, metadata)
      values ($1,$2,$3,$4,$5,$6) on conflict (conversation_id,id) do update
      set parts=excluded.parts, metadata=excluded.metadata where messages.user_id=excluded.user_id returning id`,
      [
        message.id,
        id,
        userId,
        message.role,
        JSON.stringify(message.parts),
        JSON.stringify(message.metadata ?? null),
      ]
    )
    if (!saved.rows.length)
      throw new HttpError(409, 'conflict', 'Message could not be saved. Start a new conversation.')
  }
}

export async function createConversation(
  userId: string,
  input: {
    id?: string
    projectRef: string
    orgSlug: string
    name?: string
    model?: string
    branchedFrom?: { chat_id: string; message_id: string }
    supportMetadata?: unknown
  }
) {
  return adminTransaction(async (client) => {
    let branchMessages: UIMessage[] = []
    if (input.branchedFrom) {
      const parent = await lockConversation(client, input.branchedFrom.chat_id, userId)
      if (parent.project_ref !== input.projectRef || parent.org_slug !== input.orgSlug)
        throw new HttpError(403, 'unauthorized', 'Cannot branch a different project.')
      const { rows } = await client.query<MessageRow>(
        `select * from public.messages where conversation_id=$1 and user_id=$3
        and seq <= (select seq from public.messages where conversation_id=$1 and id=$2 and user_id=$3) order by seq desc limit 100`,
        [parent.id, input.branchedFrom.message_id, userId]
      )
      if (!rows.length) throw new HttpError(404, 'not_found', 'Branch message not found.')
      branchMessages = rows
        .reverse()
        .map(messageToUIMessage)
        .map((message) => ({
          ...message,
          parts: message.parts.filter(
            (part) =>
              !('state' in part) ||
              typeof part.state !== 'string' ||
              !['approval-requested', 'approval-responded'].includes(part.state)
          ),
        }))
    }
    const { rows } = await client.query<ConversationRow>(
      `insert into public.conversations
      (id,user_id,project_ref,org_slug,name,model,branched_from,support_metadata)
      values (coalesce($1::uuid,gen_random_uuid()),$2,$3,$4,coalesce($5,'Untitled'),$6,$7,$8) returning *`,
      [
        input.id ?? null,
        userId,
        input.projectRef,
        input.orgSlug,
        input.name ?? null,
        input.model ?? null,
        JSON.stringify(input.branchedFrom ?? null),
        JSON.stringify(input.supportMetadata ?? null),
      ]
    )
    await writeMessages(client, rows[0].id, userId, branchMessages)
    return { ...rows[0], revision: Number(rows[0].revision) }
  })
}

export async function updateConversation(
  userId: string,
  id: string,
  patch: {
    name?: string
    model?: string
    support_metadata?: unknown
    revision: number
  }
) {
  return adminTransaction(async (client) => {
    // Support ticket synchronization does not alter the in-flight model history.
    const isMetadataOnly =
      patch.support_metadata !== undefined && patch.name === undefined && patch.model === undefined
    await lockConversation(client, id, userId, patch.revision, isMetadataOnly)
    const { rows } = await client.query<ConversationRow>(
      `update public.conversations set
      name=coalesce($3,name), model=coalesce($4,model), support_metadata=coalesce($5::jsonb,support_metadata),
      revision=revision+1, updated_at=now() where id=$1 and user_id=$2 returning *`,
      [
        id,
        userId,
        patch.name ?? null,
        patch.model ?? null,
        patch.support_metadata === undefined ? null : JSON.stringify(patch.support_metadata),
      ]
    )
    return { ...rows[0], revision: Number(rows[0].revision) }
  })
}

export async function softDeleteConversation(userId: string, id: string, revision: number) {
  return adminTransaction(async (client) => {
    await lockConversation(client, id, userId, revision)
    await client.query(
      'update public.conversations set deleted_at=now(), revision=revision+1 where id=$1 and user_id=$2',
      [id, userId]
    )
  })
}

export async function truncateMessages(
  userId: string,
  id: string,
  revision: number,
  fromMessageId?: string
) {
  return adminTransaction(async (client) => {
    await lockConversation(client, id, userId, revision)
    if (fromMessageId) {
      const target = await client.query(
        'select seq from public.messages where conversation_id=$1 and id=$2',
        [id, fromMessageId]
      )
      if (!target.rows.length) throw new HttpError(404, 'not_found', 'Message not found.')
      await client.query('delete from public.messages where conversation_id=$1 and seq >= $2', [
        id,
        target.rows[0].seq,
      ])
    } else {
      await client.query('delete from public.messages where conversation_id=$1', [id])
    }
    await client.query(
      'update public.conversations set revision=revision+1, updated_at=now() where id=$1',
      [id]
    )
    return revision + 1
  })
}

export async function beginTurn(
  userId: string,
  id: string,
  requestId: string,
  revision: number,
  incoming: UIMessage[],
  trigger?: string,
  supportMetadata?: unknown
) {
  return withSessionStoreErrors(async () => {
    const result = await assistantSessionStore.startRun<ConversationRow>({
      userId,
      sessionId: id,
      runId: requestId,
      revision,
      incoming,
      reconcile: (previous, next) =>
        reconcileMessages(previous, next, trigger, {
          context: { userId, ownerId: userId },
          canRespondToApproval: canRespondToAssistantApproval,
        }),
      onClaim: async (database) => {
        if (supportMetadata !== undefined) {
          await database.query(
            'update public.conversations set support_metadata=$3::jsonb where id=$1 and user_id=$2',
            [id, userId, JSON.stringify(supportMetadata)]
          )
        }
      },
    })
    return { conversation: result.session, messages: result.messages, revision: result.revision }
  })
}

export async function finishTurn(
  userId: string,
  id: string,
  requestId: string,
  responseMessage?: UIMessage,
  status?: 'completed' | 'failed' | 'cancelled'
) {
  await withSessionStoreErrors(() =>
    assistantSessionStore.finishRun({
      userId,
      sessionId: id,
      runId: requestId,
      responseMessage,
      status,
      onFinish: async (database) => {
        const rename = responseMessage?.parts.find(
          (part) => part.type === 'tool-rename_chat' && 'input' in part
        )
        if (
          rename &&
          'input' in rename &&
          rename.input &&
          typeof rename.input === 'object' &&
          'newName' in rename.input &&
          typeof rename.input.newName === 'string'
        ) {
          await database.query(
            'update public.conversations set name=$3 where id=$1 and user_id=$2',
            [id, userId, rename.input.newName.slice(0, 200)]
          )
        }
      },
    })
  )
}

export async function insertFeedback(
  userId: string,
  input: {
    conversationId: string
    messageId: string
    rating: string
    reason?: string
    braintrustSpanId?: string
  }
) {
  const rows = await adminQuery(
    `insert into public.message_feedback(conversation_id,message_id,user_id,rating,reason,braintrust_span_id)
    select m.conversation_id,m.id,$3,$4,$5,$6 from public.messages m
    join public.conversations c on c.id=m.conversation_id
    where m.conversation_id=$1 and m.id=$2 and m.user_id=$3 and c.user_id=$3 and c.deleted_at is null returning id`,
    [
      input.conversationId,
      input.messageId,
      userId,
      input.rating,
      input.reason ?? null,
      input.braintrustSpanId ?? null,
    ]
  )
  if (!rows.length) throw new HttpError(404, 'not_found', 'Message not found.')
}
