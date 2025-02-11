import { Monaco } from '@monaco-editor/react'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import getPgsqlCompletionProvider from 'components/ui/CodeEditor/Providers/PgSQLCompletionProvider'
import getPgsqlSignatureHelpProvider from 'components/ui/CodeEditor/Providers/PgSQLSignatureHelpProvider'
import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import { useKeywordsQuery } from 'data/database/keywords-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTableColumnsQuery } from 'data/database/table-columns-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { formatSql } from 'lib/formatSql'
import { IDisposable } from 'monaco-editor'
import { useEffect, useRef } from 'react'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'

export const useAddDefinitions = (id: string, monaco: Monaco | null) => {
  const { project } = useProjectContext()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [intellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  const { data: keywords, isSuccess: isKeywordsSuccess } = useKeywordsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: intellisenseEnabled }
  )
  const { data: functions, isSuccess: isFunctionsSuccess } = useDatabaseFunctionsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: intellisenseEnabled }
  )
  const { data: schemas, isSuccess: isSchemasSuccess } = useSchemasQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: intellisenseEnabled }
  )
  const { data: tableColumns, isSuccess: isTableColumnsSuccess } = useTableColumnsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: intellisenseEnabled }
  )

  const pgInfoRef = useRef<any>(null)

  const isPgInfoReady =
    intellisenseEnabled &&
    isTableColumnsSuccess &&
    isSchemasSuccess &&
    isKeywordsSuccess &&
    isFunctionsSuccess

  if (isPgInfoReady) {
    if (pgInfoRef.current === null) {
      pgInfoRef.current = {}
    }
    pgInfoRef.current.tableColumns = tableColumns
    pgInfoRef.current.schemas = schemas
    pgInfoRef.current.keywords = keywords
    pgInfoRef.current.functions = functions
  }

  //  Enable pgsql format
  useEffect(() => {
    if (monaco) {
      const formatProvider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model) {
          const value = model.getValue()
          const formatted = formatSql(value)
          if (id) snapV2.setSql(id, formatted)
          return [{ range: model.getFullModelRange(), text: formatted }]
        },
      })
      return () => formatProvider.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco])

  // Register auto completion item provider for pgsql
  useEffect(() => {
    let completeProvider: IDisposable | null = null
    let signatureHelpProvider: IDisposable | null = null

    if (isPgInfoReady) {
      if (monaco && isPgInfoReady) {
        completeProvider = monaco.languages.registerCompletionItemProvider(
          'pgsql',
          getPgsqlCompletionProvider(monaco, pgInfoRef)
        )
        signatureHelpProvider = monaco.languages.registerSignatureHelpProvider(
          'pgsql',
          getPgsqlSignatureHelpProvider(monaco, pgInfoRef)
        )
      }
    }
    return () => {
      completeProvider?.dispose()
      signatureHelpProvider?.dispose()
    }
  }, [isPgInfoReady, monaco])
}
