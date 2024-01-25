import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(req: Request, { params }: { params: { threadId: string } }) {
  if (!req.body) {
    return Response.error()
  }

  const kill = await openai.beta.threads.del(params.threadId)
  console.log({ kill })
  return Response.json({})
}
