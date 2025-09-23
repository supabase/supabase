import { generateText } from 'ai'
import { source } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'

const explainSchema = z.object({
  plan: z.string().describe('The EXPLAIN/EXPLAIN ANALYZE output. Can be TEXT, JSON, or YAML.'),
  query: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      return res
        .status(405)
        .json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

export async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { data, error } = explainSchema.safeParse(body)

  if (error) {
    return res.status(400).json({ error: 'Invalid request body', issues: error.issues })
  }

  const { plan, query } = data

  if (!plan || plan.trim().length === 0) {
    return res.status(400).json({ error: 'Plan is required' })
  }

  try {
    const { model, error: modelError } = await getModel({
      provider: 'openai',
      routingKey: 'sql-explain',
    })

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

    const result = await generateText({
      model,
      prompt: source`
        You are a PostgreSQL performance expert helping someone who is not a database expert understand their query performance.

        Task:
        - Interpret the following EXPLAIN or EXPLAIN ANALYZE output in plain, non-technical language.
        - Explain what the database is doing to execute this query, using simple analogies when helpful.
        - Focus on performance issues that matter: slow operations, inefficient data access patterns, and resource usage.
        - Provide actionable recommendations that a developer can implement, with clear explanations of why each suggestion helps.
        - If this is EXPLAIN only (without ANALYZE), note that recommendations are based on database estimates, not actual performance.
        - Keep explanations and the length of the response as concise as possible without losing any action items

        Output format requirements (Markdown):
        - Write in simple, jargon-free language. When you must use database terms, explain them briefly (e.g., "Sequential Scan - reading every row in the table").
        - Structure your response with these sections:
          ### What your query is doing
          Brief explanation of the database's approach to answering your query.
          
          ### Performance observations
          Key findings about speed, efficiency, and resource usage.
          
          ### Recommended improvements
          Specific, actionable steps to make the query faster, with explanations of why each helps.
        
        - For any suggested code changes, use fenced code blocks with the sql language hint.
        - Prioritize suggestions by potential impact.
        - You are providing a single answer only, there will be no follow up questions

        ${query ? source`Original query:\n${query}` : ''}
        Plan output:
        ${plan}
      `,
    })

    // Return plain text (mirrors cron route returning a single string)
    return res.json(result.text)
  } catch (err) {
    if (err instanceof Error) {
      console.error(`AI EXPLAIN analysis failed: ${err.message}`)

      // Check for context length error
      if (err.message.includes('context_length') || err.message.includes('too long')) {
        return res.status(400).json({
          error:
            'Your EXPLAIN output is too large for Supabase Assistant to ingest. Try trimming it or using JSON format.',
        })
      }
    } else {
      console.error(`Unknown error: ${err}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error analyzing the EXPLAIN output. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
