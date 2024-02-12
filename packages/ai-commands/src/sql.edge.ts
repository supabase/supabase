import { OpenAIStream } from 'ai'
import { codeBlock, oneLine, stripIndent } from 'common-tags'
import OpenAI from 'openai'
import { ContextLengthError } from './errors'

export type AiAssistantMessage = {
  content: string
  role: 'user' | 'assistant'
}

/**
 * Responds to a conversation about building an RLS policy.
 *
 * @returns A `ReadableStream` containing the response text and SQL.
 */
export async function chatRlsPolicy(
  openai: OpenAI,
  messages: AiAssistantMessage[],
  entityDefinitions?: string[],
  policyDefinition?: string
): Promise<ReadableStream<Uint8Array>> {
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
        \`\`\`sql
        CREATE POLICY "My descriptive policy." ON users FOR INSERT USING (user_name = current_user) WITH (true);
        \`\`\`
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

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
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
