import type OpenAI from 'openai'
import { ContextLengthError } from '../errors'
import { jsonrepair } from 'jsonrepair'
import { codeBlock } from 'common-tags'

// Responds to a natural language request for cron syntax.
export async function generateCron(openai: OpenAI, prompt: string) {
  const initMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: codeBlock`
        You are a cron syntax expert. Your purpose is to convert natural language time descriptions into valid cron expressions for pg_cron.

        Rules for responses:
        - Output cron expressions in the 6-field format supported by pg_cron (seconds minute hour day month weekday)
        - The seconds field is optional - if not specified, it defaults to 0
        - Provide a brief explanation of what the cron expression does
        - Format output as markdown with the cron expression in a code block
        - If the request is unclear or impossible, ask for clarification
        - If the request isn't related to cron scheduling, explain that you can only help with cron expressions

        Example input: "Every Monday at 3am"
        Example output:
        This cron expression runs every Monday at 3:00:00 AM:
        \`\`\`
        0 0 3 * * 1
        \`\`\`

        Common patterns to remember:
        - * means "every" for that field
        - */n means "every n intervals"
        - n means "exactly at n"
        - n,m means "at n and m"
        - n-m means "every value from n to m"

        Field order: seconds (0-59), minute (0-59), hour (0-23), day (1-31), month (1-12), weekday (0-6, Sunday=0)

        Here is the user's prompt:
        ${prompt}
      `,
    },
  ]

  const completionFunction = {
    name: 'generateCronSyntax',
    description: 'Generates a cron expression for a given natural language description.',
    parameters: {
      type: 'object',
      properties: {
        cron_expression: {
          type: 'string',
          description: 'The generated cron expression.',
        },
      },
      required: ['cron_expression'],
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
      throw new Error('No cron expression generated')
    }

    // Use jsonrepair before parsing
    const repairedJsonString = jsonrepair(functionArgs)
    const args = JSON.parse(repairedJsonString)

    return args.cron_expression
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'context_length_exceeded') {
      throw new ContextLengthError()
    }
    throw error
  }
}
