import { OpenAIStream } from 'ai'
import { codeBlock, oneLine, stripIndent } from 'common-tags'
import type OpenAI from 'openai'
import { ContextLengthError } from '../errors'
import type { Message } from '../types'

/**
 * Responds to a conversation about writing a SQL query.
 *
 * @returns A `ReadableStream` containing the response text and SQL.
 */
export async function chatSql(
  openai: OpenAI,
  messages: Message[],
  existingSql?: string,
  entityDefinitions?: string[],
  context?: 'rls-policies' | 'functions'
): Promise<ReadableStream<Uint8Array>> {
  const initMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: stripIndent`
      The generated SQL (must be valid SQL), and must adhere to the following:
      - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
      - Always use semicolons
      - Output as markdown
      - Always include code snippets if available
      - Use vector(384) data type for any embedding/vector related query

      When generating tables, do the following:
      - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
      - Prefer creating foreign key references in the create statement
      - Prefer 'text' over 'varchar'
      - Prefer 'timestamp with time zone' over 'date'

      Feel free to suggest corrections for suspected typos.
      `,
    },
  ]

  if (context) {
    // [Joshen] Thinking how we can prompt-engineer to give even better results, what I have below
    // is definitely not optimal at all, but just to get an idea started
    const generateInstructionsBasedOnContext = () => {
      switch (context) {
        // [Joshen] Sorry for the mess, there's duplicate logic here between this and rls.ts - i'm wondering what should be the best practice
        // here? Do we (1) Put ALL logic into this file, or (2) we split each context into their own files? Latter might be cleaner?
        case 'rls-policies':
          return stripIndent`
          You're a Supabase Postgres expert in writing row level security policies. Your purpose is to
          generate a policy with the constraints given by the user. You will be provided a schema
          on which the policy should be applied.`
        case 'functions':
          return stripIndent`
          You're a Supabase Postgres expert in writing database functions. Your purpose is to generate a
          database function with the constraints given by the user. The output may also include a database trigger
          if the function returns a type of trigger. When generating functions, do the following:
          - If the function returns a trigger type, ensure that it uses security definer, otherwise default to security invoker. Include this in the create functions SQL statement.
          - Ensure to set the search_path configuration parameter as '', include this in the create functions SQL statement.
          - Default to create or replace whenever possible for updating an existing function, otherwise use the alter function statement
          Please make sure that all queries are valid Postgres SQL queries.
          `
      }
    }
    initMessages.push({ role: 'user', content: generateInstructionsBasedOnContext() })
  }

  if (entityDefinitions && entityDefinitions.length > 0) {
    const definitions = codeBlock`${entityDefinitions.join('\n\n')}`
    initMessages.push({
      role: 'user',
      content: oneLine`Here is my database schema for reference: ${definitions}`,
    })
  }

  if (existingSql !== undefined && existingSql.length > 0) {
    const sqlBlock = codeBlock`${existingSql}`
    initMessages.push({
      role: 'user',
      content: codeBlock`
        Here is the existing SQL I wrote for reference:
        ${sqlBlock}
        Any SQL output should follow the casing of the existing SQL that I've written.
      `.trim(),
    })
  }

  if (messages) {
    initMessages.push(...messages)
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: initMessages,
      max_tokens: 1024,
      temperature: 0,
      stream: true,
    })

    // Transform the streamed SSE response from OpenAI to a ReadableStream
    return OpenAIStream(response)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'context_length_exceeded') {
      throw new ContextLengthError()
    }
    throw error
  }
}
