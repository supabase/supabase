import type OpenAI from 'openai'
import { ContextLengthError } from '../errors'
import { jsonrepair } from 'jsonrepair'
import { codeBlock } from 'common-tags'

// Responds to a natural language request for feedback classification.
export async function classifyFeedback(openai: OpenAI, prompt: string) {
  const initMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: codeBlock`
        You are an expert in classifying feedback. Your purpose is to classify the feedback into one of three categories:
        - Product Support
        - Product Feedback
        - Unknown

        Rules for responses:
        - If the feedback is a bug, output "Product Support"
        - If the feedback is a feature request, output "Product Feedback"
        - If the feedback is not clear, output "unknown"
        - Do not provide any explanation of what the feedback is. Just output the category.
        - Just output the category.

        Example input:
        "My log is shutdown.  2. for a week now, the scanner has not been able to send trade alert signals successfully to my telegram. 3. countless numbers of troubleshooting have been done but no result."
        Example output: support

        Example input: "I have reached the storage limit for my project and my plan. I cannot understand how I can expand the storage space in my project."
        Example output: support

        Example input: "Please delete the project x in my account"
        Example output: support

        Example input: "I cannot access my dashboard or contact support"
        Example output: support

        Example input: "I am trying to pause my Pro project"
        Example output: support

        Example input: "Please run ALTER SYSTEM SET custom.access_token_hook = 'public.custom_access_token_hook'; for my project so we can activate our JWT hook."
        Example output: support

        Here is the user's prompt:
        ${prompt}
      `,
    },
  ]

  const completionFunction = {
    name: 'classifyFeedback',
    description:
      'Classifies the feedback into one of three categories: Product Support, Product Feedback, or Unknown.',
    parameters: {
      type: 'object',
      properties: {
        feedback_category: {
          type: 'string',
          description: 'The category of the feedback.',
        },
      },
      required: ['feedback_category'],
    },
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: initMessages,
      max_tokens: 1024,
      temperature: 0,
      stream: false,
      tool_choice: {
        type: 'function',
        function: {
          name: completionFunction.name,
        },
      },
      tools: [
        {
          type: 'function',
          function: completionFunction,
        },
      ],
    })

    // Parse the JSON string in arguments using jsonrepair
    const functionArgs = response?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments
    if (!functionArgs) {
      throw new Error('No feedback category generated')
    }

    // Use jsonrepair before parsing
    const repairedJsonString = jsonrepair(functionArgs)
    const args = JSON.parse(repairedJsonString)

    return args.feedback_category
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'context_length_exceeded') {
      throw new ContextLengthError()
    }
    throw error
  }
}
