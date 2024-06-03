import { useMonaco } from '@monaco-editor/react'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'

import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import { useKeywordsQuery } from 'data/database/keywords-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTableColumnsQuery } from 'data/database/table-columns-query'
import { useFormatQueryMutation } from 'data/sql/format-sql-query'
import type { NextPageWithLayout } from 'types'

import SQLEditor from 'components/interfaces/SQLEditor/SQLEditor'
import { SQLEditorLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import getPgsqlCompletionProvider from 'components/ui/CodeEditor/Providers/PgSQLCompletionProvider'
import getPgsqlSignatureHelpProvider from 'components/ui/CodeEditor/Providers/PgSQLSignatureHelpProvider'
import { useLocalStorageQuery } from 'hooks'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { useSnippets, useSqlEditorStateSnapshot } from 'state/sql-editor'

const SqlEditor: NextPageWithLayout = () => {
  const router = useRouter()
  const monaco = useMonaco()
  const { id, ref, content } = useParams()

  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()
  const appSnap = useAppStateSnapshot()

  const snippets = useSnippets(ref)
  const { mutateAsync: formatQuery } = useFormatQueryMutation()

  const [intellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  async function formatPgsql(value: string) {
    try {
      if (!project) throw new Error('No project')
      const formatted = await formatQuery({
        projectRef: project.ref,
        connectionString: project.connectionString,
        sql: value,
      })
      return formatted.result
    } catch (error) {
      console.error('formatPgsql error:', error)
      return value
    }
  }

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
  const formatPgsqlRef = useRef(formatPgsql)
  formatPgsqlRef.current = formatPgsql

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
    pgInfoRef.current.tableColumns = tableColumns?.result
    pgInfoRef.current.schemas = schemas
    pgInfoRef.current.keywords = keywords?.result
    pgInfoRef.current.functions = functions
  }

  useEffect(() => {
    if (id === 'new' && appSnap.dashboardHistory.sql !== undefined && content === undefined) {
      const snippet = snippets.find((snippet) => snippet.id === appSnap.dashboardHistory.sql)
      if (snippet !== undefined) router.push(`/project/${ref}/sql/${appSnap.dashboardHistory.sql}`)
    }
  }, [id, snippets, content])

  // Enable pgsql format
  useEffect(() => {
    if (monaco) {
      const formatProvider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model: any) {
          const value = model.getValue()
          const formatted = await formatPgsqlRef.current(value)
          if (id) snap.setSql(id, formatted)
          return [{ range: model.getFullModelRange(), text: formatted }]
        },
      })
      return () => formatProvider.dispose()
    }
  }, [monaco])

  // Register auto completion item provider for pgsql
  useEffect(() => {
    if (isPgInfoReady) {
      let completeProvider: any
      let signatureHelpProvider: any

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

      return () => {
        completeProvider?.dispose()
        signatureHelpProvider?.dispose()
      }
    }
  }, [isPgInfoReady])

  return (
    <div className="flex-1 overflow-auto">
      <SQLEditor />
    </div>
  )
}

SqlEditor.getLayout = (page) => <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>

export default SqlEditor
