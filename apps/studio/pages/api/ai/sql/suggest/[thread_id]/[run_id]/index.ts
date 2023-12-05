import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
// This API function uses the new Threads API, which is only available on the v4 OpenAI lib.
import { OpenAI } from 'openai'

const openAiKey = process.env.OPENAI_KEY

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!openAiKey) {
    return res.status(500).json({
      error: 'No OPENAI_KEY set. Create this environment variable to use AI features.',
    })
  }

  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

export async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const openai = new OpenAI({ apiKey: openAiKey })

  const { thread_id, run_id } = req.query as { thread_id: string; run_id: string }

  const [run, { data: messages }] = await Promise.all([
    openai.beta.threads.runs.retrieve(thread_id, run_id),
    openai.beta.threads.messages.list(thread_id),
  ])

  let status = 'loading'
  if (run.status === 'completed') {
    status = 'completed'
  } else if (run.status === 'failed') {
    status = 'failed'
  }

  const result = {
    id: thread_id,
    status,
    messages: messages,
  }

  return res.json(result)
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper
