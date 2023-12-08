import { OpenAIStream, StreamingTextResponse } from 'ai'
import { codeBlock, oneLine, stripIndent } from 'common-tags'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'edge'

const openAiKey = process.env.OPENAI_KEY

export default async function handler(req: NextRequest) {
  if (!openAiKey) {
    return new Response(
      JSON.stringify({
        error: 'No OPENAI_KEY set. Create this environment variable to use AI features.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req)
    default:
      return new Response(
        JSON.stringify({ data: null, error: { message: `Method ${method} Not Allowed` } }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', Allow: 'POST' },
        }
      )
  }
}

async function handlePost(request: NextRequest) {
  const openai = new OpenAI({ apiKey: openAiKey })

  const body = await (request.json() as Promise<{
    messages: { content: string; role: 'user' | 'assistant' }[]
    entityDefinitions: string[]
    policyDefinition: string
  }>)

  const { messages, entityDefinitions, policyDefinition } = body

  const initMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: stripIndent`
        You're an Postgres expert in writing row level security policies. Your purpose is to 
        generate a policy with the constraints given by the user. You will be provided a schema 
        on which the policy should be applied.

        The output should use the following instructions:
        - The generated SQL must be valid SQL.
        - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
        - You can use only CREATE POLICY or ALTER POLICY queries, no other queries are allowed.
        - You can add short explanations to your messages.
        - The result should be a valid markdown. The SQL code should be wrapped in \`\`\`.
        - Always use "auth.uid()" instead of "current_user".
        - You can't use "USING" expression on INSERT policies.
        - Only use "WITH CHECK" expression on INSERT or UPDATE policies.
        - The policy name should be short text explaining the policy, enclosed in double quotes.
        - Always put explanations as separate text. Never use inline SQL comments. 
        - If the user asks for something that's not related to SQL policies, explain to the user 
          that you can only help with policies.
        
        The output should look like this: 
        "CREATE POLICY user_policy ON users FOR INSERT USING (user_name = current_user) WITH (true);" 
      `,
    },
  ]

  if (entityDefinitions) {
    const definitions = codeBlock`${entityDefinitions.join('\n\n')}`
    initMessages.push({
      role: 'user',
      content: oneLine`Here is my database schema for reference: ${definitions}`,
    })
  }

  if (policyDefinition !== undefined) {
    const definitionBlock = codeBlock`${policyDefinition}`
    initMessages.push({
      role: 'user',
      content: codeBlock`
        Here is my policy definition for reference:
        ${definitionBlock}
      `.trim(),
    })
  }

  if (messages) {
    initMessages.push(...messages)
  }

  const completionOptions: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
    model: 'gpt-3.5-turbo-1106',
    messages: initMessages,
    max_tokens: 1024,
    temperature: 0,
    stream: true,
  }

  try {
    const response = await openai.chat.completions.create(completionOptions)
    // Proxy the streamed SSE response from OpenAI
    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    console.error(error)

    return new Response(
      JSON.stringify({
        error: 'There was an error processing your request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
