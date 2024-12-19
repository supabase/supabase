import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { tool } from 'ai'
import { z } from 'zod'

const openAiKey = process.env.OPENAI_API_KEY

export const maxDuration = 30

const ServiceSchema = z.object({
  name: z.enum(['Auth', 'Storage', 'Database', 'Edge Function', 'Cron', 'Queues', 'Vector']),
  reason: z.string().describe("The reason why this service is needed for the user's use case"),
})

const getTools = () => {
  return {
    executeSql: tool({
      description: 'Save the generated database schema definition',
      parameters: z.object({
        sql: z.string().describe('The SQL schema definition'),
      }),
    }),

    reset: tool({
      description: 'Reset the database, services and start over',
      parameters: z.object({}),
    }),

    setServices: tool({
      description:
        'Set the entire list of Supabase services needed for the project. Always include the full list',
      parameters: z.object({
        services: z
          .array(ServiceSchema)
          .describe('Array of services with reasons why they are needed'),
      }),
    }),

    setTitle: tool({
      description: "Set the project title based on the user's description",
      parameters: z.object({
        title: z.string().describe('The project title'),
      }),
    }),

    saveUserInfo: tool({
      description: 'Save information about the user and their requirements',
      parameters: z.object({
        platform: z
          .enum(['NextJS', 'Vue', 'Vite', 'Swift', 'React Native'])
          .optional()
          .describe('The platform the user is building for'),
        userCount: z.number().optional().describe('Expected number of users'),
        industry: z.string().optional().describe('Industry or domain of the application'),
        region: z.string().optional().describe('Geographic region for deployment'),
        scale: z.string().optional().describe('Expected scale of the application'),
      }),
    }),

    setDatabaseConfig: tool({
      description: 'Save database configuration details',
      parameters: z.object({
        region: z.string().describe('The region where the database will be deployed'),
        postgresVersion: z.string().describe('The version of Postgres to use'),
        computeSize: z.string().optional().describe('The compute instance size'),
        storageSize: z.number().optional().describe('The storage size in GB'),
        highAvailability: z.boolean().optional().describe('Whether to enable high availability'),
      }),
    }),
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!openAiKey) {
    return res.status(400).json({
      error: 'No OPENAI_API_KEY set. Create this environment variable to use AI features.',
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

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { messages } = req.body

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    maxSteps: 7,
    system: `
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

  result.pipeDataStreamToResponse(res)
}
