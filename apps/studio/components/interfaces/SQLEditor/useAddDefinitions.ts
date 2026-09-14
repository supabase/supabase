import { Monaco } from '@monaco-editor/react'
import { useQueryClient } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS } from 'common'
import type { IDisposable } from 'monaco-editor'
import { useEffect } from 'react'

import getPgsqlCompletionProvider from '@/components/ui/CodeEditor/Providers/PgSQLCompletionProvider'
import getPgsqlSignatureHelpProvider from '@/components/ui/CodeEditor/Providers/PgSQLSignatureHelpProvider'
import { useDatabaseFunctionsQuery } from '@/data/database-functions/database-functions-query'
import { databaseKeys } from '@/data/database/keys'
import { useKeywordsQuery } from '@/data/database/keywords-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useTableColumnsQuery } from '@/data/database/table-columns-query'
import { useSchemasFilteredForHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatSql } from '@/lib/formatSql'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

/**
 * Prevents double registration of Monaco providers (e.g registerCompletionItemProvider)
 */
const sharedRegistrations = new Map<string, { count: number; disposable?: IDisposable }>()

/**
 * Shared across every `useAddDefinitions` instance so the registered pgsql completion/signature
 * providers always read the freshest data from *any* currently active editor, not just whichever
 * instance's `register()` factory happened to run first. Without this, the provider stays bound
 * to a single per-instance ref: if that instance unmounts while a sibling editor is still active,
 * `acquireSharedRegistration`'s ref-count doesn't reach zero (so nothing gets disposed), but the
 * provider is left reading a ref that will never be written to again.
 */
const sharedPgInfoRef: { current: any } = { current: null }

export function acquireSharedRegistration(key: string, register: () => IDisposable) {
  const existing = sharedRegistrations.get(key)
  if (existing) {
    existing.count += 1
  } else {
    sharedRegistrations.set(key, { count: 1, disposable: register() })
  }

  return () => {
    const entry = sharedRegistrations.get(key)
    if (!entry) return

    entry.count -= 1
    if (entry.count <= 0) {
      entry.disposable?.dispose()
      sharedRegistrations.delete(key)
    }
  }
}

export const useAddDefinitions = (
  id: string,
  monaco: Monaco | null,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const queryClient = useQueryClient()

  const [intellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  const { data: keywords, isSuccess: isKeywordsSuccess } = useKeywordsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: enabled && intellisenseEnabled }
  )
  const { data: functions, isSuccess: isFunctionsSuccess } = useDatabaseFunctionsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: enabled && intellisenseEnabled }
  )
  const { data: schemas, isSuccess: isSchemasSuccess } = useSchemasQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: enabled && intellisenseEnabled }
  )
  const { data: tableColumns, isSuccess: isTableColumnsSuccess } = useTableColumnsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: enabled && intellisenseEnabled }
  )

  const filteredSchemas = useSchemasFilteredForHighAvailability(schemas)

  const isPgInfoReady =
    enabled &&
    intellisenseEnabled &&
    isTableColumnsSuccess &&
    isSchemasSuccess &&
    isKeywordsSuccess &&
    isFunctionsSuccess

  // Keeps `sharedPgInfoRef` current for the registered pgsql completion/signature-help
  // providers. Runs in an effect — not render — so only committed tree state writes the
  // shared, module-level ref; mutating it directly during render risked a discarded or
  // interrupted render pass leaking a write that no committed render ever produced.
  useEffect(() => {
    if (isPgInfoReady) {
      if (sharedPgInfoRef.current === null) {
        sharedPgInfoRef.current = {}
      }
      sharedPgInfoRef.current.tableColumns = tableColumns
      sharedPgInfoRef.current.schemas = filteredSchemas
      sharedPgInfoRef.current.keywords = keywords
      sharedPgInfoRef.current.functions = functions
    } else if (!intellisenseEnabled) {
      // Release this instance's hold on the (potentially huge, for large databases)
      // tableColumns/functions arrays so they're actually eligible for GC — see the
      // cache-eviction effect below for why `enabled: false` alone isn't enough.
      sharedPgInfoRef.current = null
    }
  }, [isPgInfoReady, intellisenseEnabled, tableColumns, filteredSchemas, keywords, functions])

  // Actively evict the cached tableColumns/functions data when intellisense is turned off
  useEffect(() => {
    if (intellisenseEnabled) return

    queryClient.removeQueries({
      queryKey: databaseKeys.tableColumns(project?.ref, undefined, undefined),
      exact: true,
    })
    queryClient.removeQueries({
      queryKey: databaseKeys.databaseFunctions(project?.ref),
      exact: true,
    })
  }, [intellisenseEnabled, project?.ref, queryClient])

  //  Enable pgsql format
  useEffect(() => {
    if (!monaco || !enabled) return

    return acquireSharedRegistration('pgsql-format', () =>
      monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model) {
          const value = model.getValue()
          const formatted = formatSql(value)
          if (id) snapV2.setSql({ id, sql: formatted })
          return [{ range: model.getFullModelRange(), text: formatted }]
        },
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco, enabled])

  // Register auto completion item provider for pgsql
  useEffect(() => {
    if (!isPgInfoReady || !monaco) return

    return acquireSharedRegistration('pgsql-completion', () => {
      const completeProvider = monaco.languages.registerCompletionItemProvider(
        'pgsql',
        getPgsqlCompletionProvider(monaco, sharedPgInfoRef)
      )
      const signatureHelpProvider = monaco.languages.registerSignatureHelpProvider(
        'pgsql',
        getPgsqlSignatureHelpProvider(monaco, sharedPgInfoRef)
      )
      return {
        dispose: () => {
          completeProvider.dispose()
          signatureHelpProvider.dispose()
        },
      }
    })
  }, [isPgInfoReady, monaco])
}
