import { streamText, tool } from 'ai'
import { source } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'

export const maxDuration = 60

const ServiceSchema = z.object({
  name: z.enum(['Auth', 'Storage', 'Database', 'Edge Function', 'Cron', 'Queues', 'Vector']),
  reason: z.string().describe("The reason why this service is needed for the user's use case"),
})

const getTools = () => {
  return {
    executeSql: tool({
      description: 'Save the generated database schema definition',
      inputSchema: z.object({
        sql: z.string().describe('The SQL schema definition'),
      }),
    }),

    reset: tool({
      description: 'Reset the database, services and start over',
      inputSchema: z.object({}),
    }),

    setServices: tool({
      description:
        'Set the entire list of Supabase services needed for the project. Always include the full list',
      inputSchema: z.object({
        services: z
          .array(ServiceSchema)
          .describe('Array of services with reasons why they are needed'),
      }),
    }),

    setTitle: tool({
      description: "Set the project title based on the user's description",
      inputSchema: z.object({
        title: z.string().describe('The project title'),
      }),
    }),
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { model, error: modelError } = await getModel({
    provider: 'openai',
    routingKey: 'onboarding',
  })

  if (modelError) {
    return res.status(500).json({ error: modelError.message })
  }

  const { messages } = req.body

  const result = streamText({
    model,
    system: source`
      You are a Supabase expert who helps people set up their Supabase project. You specializes in database schema design. You are to help the user design a database schema for their application but also suggest Supabase services they should use. 
      
      When designing database schemas, follow these rules:
      - Generate the entire schema
      - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
      - Prefer creating foreign key references in the create statement
      - Prefer 'text' over 'varchar'
      - Prefer 'timestamp with time zone' over 'date'
      - In Supabase, the auth schema already has a users table which is used to store users
      - Create a profiles table in the public schema where the primary id is uuid and references the auth.users schema instead of creating a users table
      - Always include appropriate indexes and foreign key constraints.

      Follow these rules:
      1. Generate a database schema that meets the user's requirements by calling the executeSql tool. Make your best guess without needing to ask for more.
      2. Set the services required for the user's use case by calling the setServices tool.
      3. Set the project title by calling the setTitle tool.
      4. Always respond with a short single paragraph of less than 80 words of what you changed and the current state of the schema.
    
      If user requests to reset the database, call the reset tool.
    `,
    messages,
    tools: getTools(),
  })

  result.pipeUIMessageStreamToResponse(res)
}
