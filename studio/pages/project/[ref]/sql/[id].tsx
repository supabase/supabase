import { useMonaco } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'

import { useFunctionsQuery } from 'data/database/functions-query'
import { useKeywordsQuery } from 'data/database/keywords-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTableColumnsQuery } from 'data/database/table-columns-query'
import { useFormatQueryMutation } from 'data/sql/format-sql-query'
import { NextPageWithLayout } from 'types'

import SQLEditor from 'components/interfaces/SQLEditor/SQLEditor'
import { SQLEditorLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import getPgsqlCompletionProvider from 'components/ui/CodeEditor/Providers/PgSQLCompletionProvider'
import getPgsqlSignatureHelpProvider from 'components/ui/CodeEditor/Providers/PgSQLSignatureHelpProvider'

const SqlEditor: NextPageWithLayout = () => {
  const monaco = useMonaco()
  const { project } = useProjectContext()

  const { mutateAsync: formatQuery } = useFormatQueryMutation()
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

  const { data: keywords, isSuccess: isKeywordsSuccess } = useKeywordsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: functions, isSuccess: isFunctionsSuccess } = useFunctionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: schemas, isSuccess: isSchemasSuccess } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: tableColumns, isSuccess: isTableColumnsSuccess } = useTableColumnsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgInfoRef = useRef<any>(null)
  const formatPgsqlRef = useRef(formatPgsql)
  formatPgsqlRef.current = formatPgsql

  const isPgInfoReady =
    isTableColumnsSuccess && isSchemasSuccess && isKeywordsSuccess && isFunctionsSuccess
  if (isPgInfoReady) {
    if (pgInfoRef.current === null) {
      pgInfoRef.current = {}
    }
    pgInfoRef.current.tableColumns = tableColumns?.result
    pgInfoRef.current.schemas = schemas?.result
    pgInfoRef.current.keywords = keywords?.result
    pgInfoRef.current.functions = functions?.result
  }

  // Enable pgsql format
  useEffect(() => {
    if (monaco) {
      const formatProvider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model: any) {
          const value = model.getValue()
          const formatted = await formatPgsqlRef.current(value)
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
    <div className="SQLTabContainer flex-1">
      <SQLEditor />
    </div>
  )
}

SqlEditor.getLayout = (page) => <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>

export default observer(SqlEditor)
