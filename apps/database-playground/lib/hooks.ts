import { PGlite } from '@electric-sql/pglite'
import { nanoid } from 'ai'
import { useChat } from 'ai/react'
import { codeBlock } from 'common-tags'
import { useEffect, useState } from 'react'
import { useTablesQuery } from '~/data/tables/tables-query'
import { Report } from '~/lib/schema'

export type UseReportSuggestionsOptions = {
  enabled?: boolean
}

export function useReportSuggestions(
  db: PGlite,
  { enabled = true }: UseReportSuggestionsOptions = {}
) {
  const { data: tables } = useTablesQuery({ schemas: ['public'], includeColumns: true })
  const [reports, setReports] = useState<Report[]>()

  const { append, setMessages } = useChat({
    api: 'api/chat',
    async onToolCall({ toolCall }) {
      switch (toolCall.toolName) {
        case 'brainstormReports': {
          const { reports } = toolCall.args as any
          setReports(reports)
        }
      }
    },
  })

  useEffect(() => {
    if (enabled && tables) {
      // Provide the LLM with the current schema before invoking the tool call
      setMessages([
        {
          id: nanoid(),
          role: 'assistant',
          content: '',
          toolInvocations: [
            {
              toolCallId: nanoid(),
              toolName: 'getDatabaseSchema',
              args: {},
              result: tables,
            },
          ],
        },
      ])

      append({
        role: 'user',
        content: codeBlock`
        Brainstorm 5 interesting charts that can be generated based on tables and their columns in the database.

        Keep descriptions short and concise. Don't say "eg.". Descriptions should mention charting or visualizing.

        Titles should be 4 words or less.
      `,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tables])

  return { reports }
}
