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
      return res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { query, tables }: { query: string; tables: string } = req.body

  const prompt = stripIndent`
    ${
      tables !== undefined && tables.length > 0
        ? `
    Given the following PostgreSQL tables:
    ${tables}
    `
        : ''
    }

    Generate a Postgres SQL query based on the following natural language prompt:
    ${query}

    Postgres SQL query:
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

  if (response.error) {
    console.log('ERROR', response)
    return res.status(400).json({ error: response.error })
  } else {
    const {
      id,
      choices: [{ text }],
    } = response
    return res.status(200).json({ id, text })
  }
}
