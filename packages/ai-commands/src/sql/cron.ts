import { OpenAIStream } from 'ai'
import { codeBlock, oneLine, stripIndent } from 'common-tags'
import type OpenAI from 'openai'
import { ContextLengthError } from '../errors'
import type { Message } from '../types'
import { SchemaBuilder } from '@serafin/schema-builder'
import { debugSql } from './functions'

/**
 * Responds to a natural language request for cron syntax.
 *
 * @returns A `ReadableStream` containing the response text and SQL.
 */
export async function chatCron(openai: OpenAI, prompt: string) {
  const initMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: stripIndent`
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

  // if (prompt) {
  //   initMessages.push({ role: 'user', content: prompt })
  // }

  const generateCronSyntaxSchema = SchemaBuilder.emptySchema().addString('cron_expression', {
    description: stripIndent`
        The generated cron expression.
      `,
  })

  const completionFunction = {
    name: 'generateCronSyntax',
    description: stripIndent`
      Generates a cron expression for a given natural language description.
    `,
    parameters: generateCronSyntaxSchema.schema as Record<string, unknown>,
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-05-13',
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

    // Parse the JSON string in arguments to get make sure we have the cron_expression
    const functionArgs = response?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments
    if (!functionArgs) {
      throw new Error('No cron expression generated')
    }

    // Parse the JSON string to get the cron_expression
    const args = JSON.parse(functionArgs)
    console.log('args', args.cron_expression)
    return args.cron_expression
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'context_length_exceeded') {
      throw new ContextLengthError()
    }
    throw error
  }
}
