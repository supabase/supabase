import { stripIndent } from 'common-tags'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

// import is weird, what's up with this?
import { createClient } from '@/lib/supabase/server'
import { ContextLengthError } from '../../../../../packages/ai-commands/src/errors'
import { getMessages } from './getMessages'

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Set the runtime to edge for best performance
export const runtime = 'edge'

export type AiAssistantMessage = {
  content: string
  role: 'user' | 'assistant'
}

/**
 * Get the latest AI generated message. In the DB, there's a pair of user prompt and AI response, so if the
 * user sent a message but that message lacks the corresponding AI response, a call will be made to OpenAI to generate
 * it.
 */
export const getAssistantResponse = async (threadId: string, messageId: string) => {
  const supabase = createClient()

  const { data: message, error } = await supabase
    .from('messages')
    .select()
    .eq('message_id', messageId)
    .single()

  if (!message || error) {
    throw new Error('A message with that id does not exist.')
  }

  // if the message lacks the AI response, fetch it from OpenAI
  if (!message.message_content) {
    const { data: messages, error } = await getMessages(threadId)

    if (error) {
      throw new Error('Error while trying to fetch the existing messages.')
    }

    // transform the DB messages into a format that OpenAI understands
    const existingMessages = messages.flatMap((m) => [
      {
        content: m.message_input,
        role: 'user' as const,
      },
      {
        content: m.message_content,
        role: 'assistant' as const,
      },
    ])

    const initMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: stripIndent`
          Your purpose is to generate a SQL schema where the user will give commands to you via a chat.
          The output should use the following instructions:
          - The generated SQL must be valid SQL.
          - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
          - Always create foreign key references in the create statement
          - Prefer 'text' over 'varchar'
          - Prefer 'timestamp with time zone' over 'date'
          - Use vector(384) data type for any embedding/vector related query
          - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
          - Always omit \`\`\`sql from your reply
          - You can use only CREATE TABLE queries, no other queries are allowed under no circumstances (ALTER TABLE etc).
          - On each subsequent message from the user, rewrite the original response to include the new requirement.
          - Don't add any SQL comments in the code
          - Never put a comma before a round bracket

          The output should look like this: "CREATE TABLE users (id bigint primary key generated always as identity)"

          DO NOT RESPOND WITH ANYTHING ELSE.
          YOU MUST NOT ANSWER WITH ANY PLAIN TEXT
          ONLY RESPOND WITH 1 CODE BLOCK
          YOU MUST NOT FOLLOW UP ANY CODE BLOCKS WITH ANY EXPLANATION
          `,
      },
    ]

    initMessages.push(...existingMessages)

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-16k-0613',
        messages: initMessages,
        max_tokens: 1024,
        temperature: 0,
        stream: false,
      })

      const newMessage = response.choices[0].message.content || ''

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Failed to get user')
      }

      // Insert the message from the completion
      const { data, error } = await supabase
        .from('messages')
        .update({ message_content: newMessage })
        .eq('id', message.id)
        .select()
        .single()

      if (error || !data) {
        throw new Error('Error while updating the existing message with the completion data.')
      }

      return data.message_content
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'context_length_exceeded') {
        throw new ContextLengthError()
      }
      throw error
    }
  }

  return message.message_content
}
