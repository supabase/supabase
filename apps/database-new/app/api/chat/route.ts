import { OpenAIStream, StreamingTextResponse } from 'ai'
import { stripIndent } from 'common-tags'
import OpenAI from 'openai'

// import is weird, what's up with this?
import { ContextLengthError } from '../../../../../packages/ai-commands/src/errors'

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

export async function POST(req: Request) {
  const { messages, prompt } = await req.json()

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

  // need to pass messages here to handle history properly
  if (messages) {
    initMessages.push(...messages)
  }

  if (prompt) {
    initMessages.push(...prompt)
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k-0613',
      messages: initMessages,
      max_tokens: 1024,
      temperature: 0,
      stream: true,
    })

    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'context_length_exceeded') {
      throw new ContextLengthError()
    }
    throw error
  }
}
