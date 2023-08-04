import { useTheme } from 'common'
import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useMonaco } from '@monaco-editor/react'

import { NextPageWithLayout } from 'types'
import { useFormatQueryMutation } from 'data/sql/format-sql-query'
import { useKeywordsQuery } from 'data/database/keywords-query'
import { useFunctionsQuery } from 'data/database/functions-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTableColumnsQuery } from 'data/database/table-columns-query'

import { SQLEditorLayout } from 'components/layouts'
import SQLEditor from 'components/interfaces/SQLEditor/SQLEditor'
import SQLAI from 'components/interfaces/SQLEditor/SQLTemplates/SQLAI'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import getPgsqlCompletionProvider from 'components/ui/CodeEditor/Providers/PgSQLCompletionProvider'
import getPgsqlSignatureHelpProvider from 'components/ui/CodeEditor/Providers/PgSQLSignatureHelpProvider'

// [Joshen] Just a repeat of what's in [id], could probably make it reusable

const SqlEditorWelcome: NextPageWithLayout = () => {
  const monaco = useMonaco()
  const { isDarkMode } = useTheme()
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

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('supabase', {
        base: isDarkMode ? 'vs-dark' : 'vs',
        inherit: true,
        rules: [
          { token: '', background: isDarkMode ? '1f1f1f' : 'f0f0f0' },
          { token: 'string.sql', foreground: '24b47e' },
          { token: 'comment', foreground: '666666' },
        ],
        colors: { 'editor.background': isDarkMode ? '#1f1f1f' : '#f0f0f0' },
      })
    }
  }, [monaco, isDarkMode])

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

  return <SQLAI />
}

SqlEditorWelcome.getLayout = (page) => (
  <SQLEditorLayout title="Build with AI">{page}</SQLEditorLayout>
)

export default observer(SqlEditorWelcome)
