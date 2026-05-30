import { codeBlock } from 'common-tags'
import { jsonrepair } from 'jsonrepair'
import type OpenAI from 'openai'

import { ContextLengthError } from '../errors'

// Responds to a natural language request for cron syntax.
export async function generateCron(openai: OpenAI, prompt: string) {
  const initMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: codeBlock`
        You are a cron syntax expert. Your purpose is to convert natural language time descriptions into valid cron expressions for pg_cron.

        Rules for responses:
        - For standard intervals (minutes and above), output cron expressions in the 5-field format supported by pg_cron
        - For second-based intervals, use the special pg_cron "x seconds" syntax
        - Do not provide any explanation of what the cron expression does
        - Format output as markdown with the cron expression in a code block
        - Do not ask for clarification if you need it. Just output the cron expression.

        Example input: "Every Monday at 3am"
        Example output:
        \`\`\`
        0 3 * * 1
        \`\`\`

        Example input: "Every 30 seconds"
        Example output:
        \`\`\`
        30 seconds
        \`\`\`

        Additional examples:
        - Every minute: \`* * * * *\`
        - Every 5 minutes: \`*/5 * * * *\`
        - Every first of the month, at 00:00: \`0 0 1 * *\`
        - Every night at midnight: \`0 0 * * *\`
        - Every Monday at 2am: \`0 2 * * 1\`
        - Every 15 seconds: \`15 seconds\`
        - Every 45 seconds: \`45 seconds\`

        Field order for standard cron:
        - minute (0-59)
        - hour (0-23)
        - day (1-31)
        - month (1-12)
        - weekday (0-6, Sunday=0)

        Important: pg_cron uses "x seconds" for second-based intervals, not "x * * * *".
        If the user asks for seconds, do not use the 5-field format, instead use "x seconds".

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
