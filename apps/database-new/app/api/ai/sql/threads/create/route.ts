import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(req: Request) {
  if (!req.body) {
    return Response.error()
  }

  const { prompt } = await req.json()

  const thread = await openai.beta.threads.create()

  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: prompt,
  })

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: 'asst_oLWrK8lScZVNEpfjwUIvBAnq',
  })

  return Response.json({ threadId: thread.id, runId: run.id })
}
