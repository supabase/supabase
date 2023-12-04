import { SchemaBuilder } from '@serafin/schema-builder'
import { stripIndent } from 'common-tags'
import { isError } from 'data/utils/error-check'
import { jsonrepair } from 'jsonrepair'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'

const openAiKey = process.env.OPENAI_KEY

const generateTitleSchema = SchemaBuilder.emptySchema()
  .addString('title', {
    description: stripIndent`
      The generated title for the SQL snippet (short and concise).
      - Omit these words: 'SQL', 'Postgres', 'Query', 'Database'
    `,
  })
  .addString('description', {
    description: stripIndent`
      The generated description for the SQL snippet (longer and more detailed than title).
      - Read the SQL line by line and summarize it
    `,
  })

type GenerateTitleResult = typeof generateTitleSchema.T

const completionFunctions: Record<string, OpenAI.ChatCompletionCreateParams.Function> = {
  generateTitle: {
    name: 'generateTitle',
    description: 'Generates a short title and detailed description for a Postgres SQL snippet',
    parameters: generateTitleSchema.schema as Record<string, unknown>,
  },
}

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
  const openAI = new OpenAI({ apiKey: openAiKey })
  const {
    body: { sql },
  } = req

  const model = 'gpt-3.5-turbo-0613'
  const maxCompletionTokenCount = 1024

  const completionMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'user',
      content: sql,
    },
  ]

  const completionOptions: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: completionMessages,
    max_tokens: maxCompletionTokenCount,
    temperature: 0,
    function_call: {
      name: completionFunctions.generateTitle.name,
    },
    functions: [completionFunctions.generateTitle],
    stream: false,
  }

  let completionResponse: OpenAI.Chat.Completions.ChatCompletion
  try {
    completionResponse = await openAI.chat.completions.create(completionOptions)
  } catch (error: any) {
    console.error(`AI title generation failed: ${error.message}`)

    if ('code' in error && error.code === 'context_length_exceeded') {
      return res.status(400).json({
        error:
          'Your SQL query is too large for Supabase AI to ingest. Try splitting it into smaller queries.',
      })
    }

    return res.status(500).json({
      error: 'There was an unknown error generating the snippet title. Please try again.',
    })
  }

  const [firstChoice] = completionResponse.choices

  const titleResponseString = firstChoice.message?.function_call?.arguments

  if (!titleResponseString) {
    console.error(
      `AI title generation failed: OpenAI response succeeded, but response format was incorrect`
    )

    return res.status(500).json({
      error: 'There was an unknown error generating the snippet title. Please try again.',
    })
  }

  try {
    // Attempt to repair broken JSON from OpenAI (eg. multiline strings)
    const repairedJsonString = jsonrepair(titleResponseString)

    const generateTitleResult: GenerateTitleResult = JSON.parse(repairedJsonString)

    if (!generateTitleResult.title) {
      console.error(`AI title generation failed: Unable to generate title for the given SQL`)

      res.status(400).json({
        error: 'Unable to generate title',
      })
    }

    return res.json(generateTitleResult)
  } catch (error) {
    console.error(
      `AI SQL editing failed: ${
        isError(error) ? error.message : 'An unknown error occurred'
      }, titleResponseString: ${titleResponseString}`
    )

    return res.status(500).json({
      error: 'There was an unknown error editing the SQL snippet. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper
