import { useMonaco } from '@monaco-editor/react'
import SQLEditor from 'components/interfaces/SQLEditor/SQLEditor'
import { SQLEditorLayout } from 'components/layouts'
import getPgsqlCompletionProvider from 'components/ui/CodeEditor/Providers/PgSQLCompletionProvider'
import getPgsqlSignatureHelpProvider from 'components/ui/CodeEditor/Providers/PgSQLSignatureHelpProvider'
import { useProjectContext } from 'data/projects/ProjectContext'
import { useFormatQueryMutation } from 'data/sql/useFormatQueryMutation'
import { useFunctionsQuery } from 'data/sql/useFunctionsQuery'
import { useKeywordsQuery } from 'data/sql/useKeywordsQuery'
import { useSchemasQuery } from 'data/sql/useSchemasQuery'
import { useSqlSnippetsQuery } from 'data/sql/useSqlSnippetsQuery'
import { useTableColumnsQuery } from 'data/sql/useTableColumnsQuery'
import { useParams } from 'lib/params'
import { useEffect, useRef } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { NextPageWithLayout } from 'types'

const SqlEditorQueryPage: NextPageWithLayout = () => {
  const { ref: projectRef, id } = useParams()
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()

  useSqlSnippetsQuery(projectRef, {
    onSuccess(data) {
      if (projectRef) {
        snap.setInitialSnippets(data.snippets, projectRef)
      }
    },
  })

  const { data: tableColumns, isSuccess: isTableColumnsSuccess } = useTableColumnsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: schemas, isSuccess: isSchemasSuccess } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: keywords, isSuccess: isKeywordsSuccess } = useKeywordsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: functions, isSuccess: isFunctionsSuccess } = useFunctionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isPgInfoReady =
    isTableColumnsSuccess && isSchemasSuccess && isKeywordsSuccess && isFunctionsSuccess

  const pgInfoRef = useRef<any>(null)
  if (isPgInfoReady) {
    if (pgInfoRef.current === null) {
      pgInfoRef.current = {}
    }

    pgInfoRef.current.tableColumns = tableColumns?.result
    pgInfoRef.current.schemas = schemas?.result
    pgInfoRef.current.keywords = keywords?.result
    pgInfoRef.current.functions = functions?.result
  }

  // TODO: is dark theme hook?
  const { isDarkTheme } = { isDarkTheme: true }
  const monaco = useMonaco()

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('supabase', {
        base: isDarkTheme ? 'vs-dark' : 'vs', // can also be hc-black
        inherit: true, // can also be false to completely replace the builtin rules
        rules: [
          { token: '', background: isDarkTheme ? '1f1f1f' : 'f0f0f0' },
          { token: 'string.sql', foreground: '24b47e' },
          { token: 'comment', foreground: '666666' },
          // { token: 'predefined.sql', foreground: 'D4D4D4' },
        ],
        colors: {
          'editor.background': isDarkTheme ? '#1f1f1f' : '#f0f0f0',
          // 'editorGutter.background': '#30313f',
          // 'editorLineNumber.foreground': '#555671',
        },
      })
      monaco.editor.setTheme('supabase')
    }
  }, [monaco, isDarkTheme])

  const { mutateAsync: formatQuery } = useFormatQueryMutation()

  async function formatPgsql(value: string) {
    try {
      if (!project) {
        throw new Error('No project')
      }

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

  const formatPgsqlRef = useRef(formatPgsql)
  formatPgsqlRef.current = formatPgsql

  useEffect(() => {
    if (monaco) {
      // Enable pgsql format
      const formatProvider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model: any) {
          const value = model.getValue()
          const formatted = await formatPgsqlRef.current(value)
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ]
        },
      })

      return () => {
        formatProvider.dispose()
      }
    }
  }, [monaco])

  useEffect(() => {
    let completeProvider: any
    let signatureHelpProvider: any

    if (monaco && isPgInfoReady) {
      // register completion item provider for pgsql
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
  }, [isPgInfoReady])

  // Todo: handle 404 state

  return (
    <div className="SQLTabContainer flex-1">
      <SQLEditor key={id} id={id} isLoading={!(id && projectRef && snap.loaded[projectRef])} />
    </div>
  )
}

SqlEditorQueryPage.getLayout = (page) => <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>

export default SqlEditorQueryPage
