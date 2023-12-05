import { codeBlock } from 'common-tags'
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
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

export async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const openai = new OpenAI({ apiKey: openAiKey })

  try {
    let {
      body: { thread_id, prompt, entityDefinitions, policyDefinition },
    } = req

    if (!thread_id) {
      const thread = await openai.beta.threads.create()
      thread_id = thread.id
    }

    const prerequisites = []

    if (entityDefinitions) {
      prerequisites.push(
        codeBlock`
          Here is my database schema for reference:
          ${entityDefinitions.join('\n\n')}
        `.trim()
      )
    }

    if (policyDefinition !== undefined) {
      prerequisites.push(
        codeBlock`
          Here is my policy definition for reference:
          ${policyDefinition}
        `.trim()
      )
    }

    if (prerequisites.length > 0) {
      await openai.beta.threads.messages.create(thread_id, {
        role: 'user',
        content: prerequisites.join('\n'),
      })
    }

    await openai.beta.threads.messages.create(thread_id, {
      role: 'user',
      content: prompt,
    })

    const run = await openai.beta.threads.runs.create(thread_id, {
      assistant_id: 'asst_O89dyQ2ttPVWfs8YEjKPFqAK',
    })

    return res.json({ threadId: thread_id, runId: run.id })
  } catch (e) {
    console.log(e)
    return res.status(500)
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper
