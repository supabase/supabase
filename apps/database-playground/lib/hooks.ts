import { PGlite } from '@electric-sql/pglite'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { nanoid } from 'ai'
import { useChat } from 'ai/react'
import { codeBlock } from 'common-tags'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
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

/**
 * Hook to load/store values from local storage with an API similar
 * to `useState()`.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const queryClient = useQueryClient()
  const queryKey = ['local-storage', key]

  const { data: storedValue = initialValue } = useQuery({
    queryKey,
    queryFn: () => {
      if (typeof window === 'undefined') {
        return initialValue
      }

      const item = window.localStorage.getItem(key)

      if (!item) {
        return initialValue
      }

      return JSON.parse(item) as T
    },
  })

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    }

    queryClient.setQueryData(queryKey, valueToStore)
    queryClient.invalidateQueries({ queryKey })
  }

  return [storedValue, setValue] as const
}
