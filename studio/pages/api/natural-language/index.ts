import { stripIndent } from 'common-tags'
import apiWrapper from 'lib/api/apiWrapper'
import { post } from 'lib/common/fetch'
import { NextApiRequest, NextApiResponse } from 'next'

export default (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { query, tables } = req.body

  const prompt = stripIndent`
    Given the following PostgreSQL tables:
    ${tables}

    Generate a SQL query based on the following natural language prompt:
    ${query}

    SQL query:
  `

  const completionOptions = {
    model: 'text-davinci-003',
    prompt,
    max_tokens: 512,
    temperature: 0,
  }

  const response = await post('https://api.openai.com/v1/completions', completionOptions, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  const {
    id,
    choices: [{ text }],
  } = response

  if (response.error) {
    return res.status(400).json({ error: response.error })
  } else {
    return res.status(200).json({ id, text })
  }
}
