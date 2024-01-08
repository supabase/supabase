import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { stripIndent } from 'common-tags'

// import is weird, fix
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
  // @TODO need to pass existing messages here too
  let messages: AiAssistantMessage[] = []

  const { prompt } = await req.json()

  const initMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: stripIndent`
        You're an Postgres expert in writing database schemas. Your purpose is to
        generate schemas with the constraints given by the user. You will be provided a set of
        instructions and from this, you should generate a database schema.

        The output should use the following instructions:
        - The generated SQL must be valid SQL.
        - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
        - You can use only CREATE TABLE queries, no other queries are allowed.
        - The result should be a valid markdown.
        - Always use "auth.uid()" instead of "current_user".
        - Do not include any explanations. Only write SQL, never anything else.
        - If the user asks for something that's not related to SQL policies, explain to the user
          that you can only help with creating database schemas.

        The output should look like this, but be relevant to the user's prompt:
        "CREATE TABLE
          users (
          id bigint primary key generated always as identity,
          username text,
          email text,
          password text,
          joined_at timestamp with time zone
        );"
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
      model: 'gpt-3.5-turbo-1106',
      messages: initMessages,
      max_tokens: 1024,
      temperature: 0,
      stream: true,
    })

    // Transform the streamed SSE response from OpenAI to a ReadableStream
    //return OpenAIStream(response)
    const stream = OpenAIStream(response)
    // Respond with the stream
    return new StreamingTextResponse(stream)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'context_length_exceeded') {
      throw new ContextLengthError()
    }
    throw error
  }

  //   // Ask OpenAI for a streaming completion given the prompt
  //   const response = await openai.completions.create({
  //     model: 'text-davinci-003',
  //     stream: true,
  //     temperature: 0.6,
  //     max_tokens: 300,
  //     prompt: `Give people advice about setting up a database

  // Developer: I want to create a twitter clone
  // Expert: "You should create four tables: users, tweets, likes, comments. "
  // Developer: I want to create a todo list
  // Expert: "You should create two tables: todos and users"
  // Developer: ${prompt}
  // Expert:`,
  //   })
  // Convert the response into a friendly text-stream
  // const stream = OpenAIStream(response)
  // Respond with the stream
  // return new StreamingTextResponse(stream)
}
