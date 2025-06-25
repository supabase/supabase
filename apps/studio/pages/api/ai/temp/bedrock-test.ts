import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { awsCredentialsProvider } from '@vercel/functions/oidc'
import { CoreMessage, streamText } from 'ai-4'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

const bedrock = createAmazonBedrock({
  credentialProvider: awsCredentialsProvider({
    roleArn: process.env.AWS_BEDROCK_ROLE_ARN!,
  }),
})

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const requestBodySchema = z.object({
  messages: z.array(messageSchema),
})

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

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { data, error: parseError } = requestBodySchema.safeParse(req.body)

  if (parseError) {
    return res.status(400).json({
      error: 'Invalid request body',
      issues: parseError.issues,
    })
  }

  const { messages: clientMessages } = data

  const model = bedrock('us.anthropic.claude-sonnet-4-20250514-v1:0')
  const messages: CoreMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant.',
    },
    ...clientMessages,
  ]

  const result = streamText({
    model,
    messages,
    onError: ({ error }) => {
      console.error(error)
    },
  })

  return result.pipeDataStreamToResponse(res)
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: false })

export default wrapper
