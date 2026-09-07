import { isDeepStrictEqual } from 'node:util'

import { HttpError } from '../http/errors'
import { adminQuery } from './postgres'

// Claim before making the external call. An uncertain or failed attempt is never
// retried automatically: the user must inspect the project before making a new call.
export async function executeOnce(
  conversationId: string,
  toolCallId: string,
  toolName: string,
  input: unknown,
  execute: () => Promise<unknown>
): Promise<unknown> {
  const inserted = await adminQuery(
    `insert into private.tool_executions
    (conversation_id, tool_call_id, tool_name, input, status) values ($1,$2,$3,$4,'started')
    on conflict do nothing returning tool_call_id`,
    [conversationId, toolCallId, toolName, JSON.stringify(input)]
  )
  if (inserted.length === 0) {
    const [existing] = await adminQuery(
      `select tool_name, input, status, output from private.tool_executions
      where conversation_id=$1 and tool_call_id=$2`,
      [conversationId, toolCallId]
    )
    if (
      existing?.tool_name === toolName &&
      isDeepStrictEqual(existing.input, input) &&
      existing.status === 'completed'
    )
      return existing.output
    throw new HttpError(
      409,
      'conflict',
      'This operation was already attempted. Check the project before trying a new operation.'
    )
  }
  try {
    const output = await execute()
    await adminQuery(
      `update private.tool_executions set status='completed', output=$3
      where conversation_id=$1 and tool_call_id=$2`,
      [conversationId, toolCallId, JSON.stringify(output ?? null)]
    )
    return output
  } catch (error) {
    await adminQuery(
      `update private.tool_executions set status='failed' where conversation_id=$1 and tool_call_id=$2`,
      [conversationId, toolCallId]
    )
    throw error
  }
}
