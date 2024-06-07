import { openai } from '@ai-sdk/openai'
import { convertToCoreMessages } from 'ai'
import { FunctionBinding, streamTextWithInterpreter } from 'ai-sandbox'
import { codeBlock } from 'common-tags'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export type RequestBody = {
  messages: any[]
  functionBindings: Record<string, FunctionBinding>
}

export async function POST(req: Request) {
  const { messages, functionBindings }: RequestBody = await req.json()

  const coreMessages = convertToCoreMessages(messages as any)

  const result = await streamTextWithInterpreter({
    system: codeBlock`
      You are a helpful assistant.
      
      All math equations and expressions must be written in KaTex and must be wrapped in double dollar \`$$\`:
        - Inline: $$\\sqrt{26}$$
        - Multiline:
            $$
            \\sqrt{26}
            $$
    `,
    model: openai('gpt-4o-2024-05-13'),
    messages: coreMessages,
    functionBindings,
  })

  return new Response(result)
}
