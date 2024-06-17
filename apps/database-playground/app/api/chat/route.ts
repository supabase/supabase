import { openai } from '@ai-sdk/openai'
import { convertToCoreMessages, streamText } from 'ai'
import { codeBlock } from 'common-tags'
import { z } from 'zod'
import { reportSchema, tabsSchema } from '~/lib/schema'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    system: codeBlock`
      You are a helpful database assistant. Under the hood you have access to a Postgres database.

      When generating tables, do the following:
      - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
      - Prefer 'text' over 'varchar'
      - Keep explanations brief but helpful

      When creating sample data:
      - Make the data realistic, including joined data
      - Check for existing records/conflicts in the table
      
      You also know math. All math equations and expressions must be written in KaTex and must be wrapped in double dollar \`$$\`:
        - Inline: $$\\sqrt{26}$$
        - Multiline:
            $$
            \\sqrt{26}
            $$

      No images are allowed. Do not try to link images.

      Err on the side of caution. Ask the user to confirm before any mutating operations.
      
      If you're just querying schema, data, or showing charts, go ahead and do it without asking.

      Feel free to suggest corrections for suspected typos.
    `,
    model: openai('gpt-4o-2024-05-13'),
    messages: convertToCoreMessages(messages),
    tools: {
      getDatabaseSchema: {
        description:
          'Gets all table and column data within the public schema in the Postgres database.',
        parameters: z.object({}),
      },
      executeSql: {
        description:
          "Executes Postgres SQL against the user's database. Perform joins automatically. Always add limits for safety.",
        parameters: z.object({ sql: z.string() }),
      },
      brainstormReports: {
        description: 'Brainstorms some interesting reports to show to the user.',
        parameters: z.object({
          reports: z.array(reportSchema),
        }),
      },
      generateChart: {
        description: codeBlock`
          Generates a chart using Chart.js for a given SQL query.
          - Label both axises
          - Plugins are not available
          
          Call \`executeSql\` first.
        `,
        parameters: z.object({
          config: z
            .any()
            .describe(
              'The `config` passed to `new Chart(ctx, config). Includes `type`, `data`, `options`, etc.'
            ),
        }),
      },
      switchTab: {
        description: codeBlock`
          Switches to a different tab.
        `,
        parameters: z.object({
          tab: tabsSchema,
        }),
      },
    },
  })

  return result.toAIStreamResponse()
}
