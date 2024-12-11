import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { getTools } from './tools'

const openAiKey = process.env.OPENAI_API_KEY

export const maxDuration = 30

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('received!')
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
      - Create a profiles table in the public schema that links to auth.users instead of creating a users table
      - Always include appropriate indexes and foreign key constraints.


      Follow these rules:
      • Do not ask for more information.
      • Always call the executeSql tool when generating the database schema.
      • Always set services after the user has provided a description of the application.
      • Do not display SQL to the user or ask for confirmation.
      • Do not explain every detail of the schema. e.g. no need to explain column names
      • All tools can be called in parallel.
      • Always assess services required after each message. If a feature is added, decide whether that feature requires a new service. If so, call setServices with the new service as well as the existing services
      • When setting services, include the complete list of required services (e.g. if adding storage to existing auth and database, include all three in the list vs just adding storage).
      • Storage is used for file uploads.
      • Auth is used for authentication.
      • Database is used for storing data.
      • Realtime is used for real-time updates.
      • Edge Functions are used for serverless functions.
      • Cron is used for scheduled tasks.
      • Set a unique project title unless user provided one.
      • Always set userInfo and dbConfig yourself after a description is provided by just inferring from the messages. Always add all existing and new user info and db config details to the tool call.
      • Keep responses concise and to the point.
    `,
    messages,
    tools: getTools(),
  })

  result.pipeDataStreamToResponse(res)
}
