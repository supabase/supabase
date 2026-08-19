import { useState } from 'react'
import { toast } from 'sonner'

import {
  assembleCompletionDiff,
  buildCompletionRequestBody,
  type SqlDialect,
} from '@/components/interfaces/SQLEditor/SQLEditor.utils'
import { type EditorSelection } from '@/components/ui/AIEditor/utils'
import { constructHeaders } from '@/data/fetchers'
import { stripSqlCodeFences } from '@/data/logs/logs-sql-rewrite'
import { useLogsAttributeKeys } from '@/hooks/analytics/useLogsAttributeKeys'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { BASE_PATH } from '@/lib/constants'
import { formatSql } from '@/lib/formatSql'
import { getErrorMessage } from '@/lib/get-error-message'

export function useQueryEditorAi({ dialect }: { dialect: SqlDialect }) {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { fetchAttributeKeys } = useLogsAttributeKeys()

  const [isCompletionLoading, setIsCompletionLoading] = useState(false)

  const isClickhouse = dialect === 'clickhouse'

  const requestCompletion = async (
    prompt: string,
    context: Pick<EditorSelection, 'selection' | 'beforeSelection' | 'afterSelection'>
  ) => {
    setIsCompletionLoading(true)
    try {
      // Grounds ClickHouse edits in the source's real log_attributes keys, the same
      // way the whole-query rewrite does — otherwise inline edits invent dotted paths.
      const [headerData, availableKeys] = await Promise.all([
        constructHeaders(),
        isClickhouse
          ? fetchAttributeKeys(context.beforeSelection + context.selection + context.afterSelection)
          : undefined,
      ])
      const authorizationHeader = headerData.get('Authorization')

      const response = await fetch(`${BASE_PATH}/api/ai/code/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
        },
        body: JSON.stringify(
          buildCompletionRequestBody({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            orgSlug: organization?.slug,
            dialect,
            options: {
              completionMetadata: {
                textBeforeCursor: context.beforeSelection,
                textAfterCursor: context.afterSelection,
                language: 'pgsql',
                prompt,
                selection: context.selection,
                ...(availableKeys ? { availableKeys } : {}),
              },
            },
          })
        ),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to generate completion')
      }

      // API returns a JSON-encoded string
      const text: string = await response.json()

      const meta = {
        textBeforeCursor: context.beforeSelection,
        textAfterCursor: context.afterSelection,
        selection: context.selection,
      }
      // The clickhouse system prompt forbids fences, but strip them defensively so
      // a chatty model can't leak backticks into the snippet.
      const { original, modified } = assembleCompletionDiff(
        meta,
        isClickhouse ? stripSqlCodeFences(text) : text
      )

      // sql-formatter is Postgres-only — it mangles ClickHouse backticks and map
      // lookups — so ClickHouse output goes into the diff unformatted.
      return { original, modified: isClickhouse ? modified : formatSql(modified) }
    } catch (error) {
      toast.error(`Failed to generate SQL: ${getErrorMessage(error, 'Unknown error')}`)
      throw error
    } finally {
      setIsCompletionLoading(false)
    }
  }

  return { requestCompletion, isCompletionLoading }
}
