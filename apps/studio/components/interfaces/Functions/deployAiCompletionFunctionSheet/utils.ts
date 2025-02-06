export const generateFunctionCode = (
  prompt: string,
  baseUrl: string,
  model: string,
  stream: boolean
) => {
  const code = `import OpenAI from 'https://deno.land/x/openai@v4.24.0/mod.ts'

Deno.serve(async (req) => {
  const { query } = await req.json()
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: '${baseUrl}',
  })

  const initMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    ${
      prompt &&
      `{
      role: 'system',
      content: \`
${prompt}
\`
    }`
    }
  ]
  
  initMessages.push({
    role: 'user',
    content: query,
  })

  const chatCompletion = await openai.chat.completions.create({
    messages: initMessages,
    model: '${model}',
    stream: ${stream},
  })

${
  stream
    ? `
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chatCompletion) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            controller.enqueue(new TextEncoder().encode(content))
          }
        }
      } catch (error) {
        controller.error(error)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
`
    : `
  const reply = chatCompletion.choices[0].message.content

  return new Response(reply, { headers: { 'Content-Type': 'text/plain' } })
`
}})
`

  return code
}
