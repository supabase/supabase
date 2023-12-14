import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(req: Request, { params }: { params: { threadId: string } }) {
  if (!req.body) {
    return Response.error()
  }

  const { prompt } = await req.json()

  const message = await openai.beta.threads.messages.create(params.threadId, {
    content: prompt,
    role: 'user',
  })

  const run = await openai.beta.threads.runs.create(message.thread_id, {
    assistant_id: 'asst_oLWrK8lScZVNEpfjwUIvBAnq',
  })

  return Response.json({ threadId: message.thread_id, runId: run.id })
}
