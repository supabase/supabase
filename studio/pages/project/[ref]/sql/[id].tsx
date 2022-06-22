import { useMonaco } from '@monaco-editor/react'
import SQLEditor from 'components/interfaces/SQLEditor/SQLEditor'
import { SQLEditorLayout } from 'components/layouts'
import { useSqlSnippetsQuery } from 'data/sql/useSqlSnippetsQuery'
import { useParams } from 'lib/params'
import { useEffect } from 'react'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { NextPageWithLayout } from 'types'

const SqlEditorQueryPage: NextPageWithLayout = () => {
  const { ref: projectRef, id } = useParams()
  const snap = useSqlEditorStateSnapshot()

  useSqlSnippetsQuery(projectRef, {
    onSuccess(data) {
      if (projectRef) {
        snap.setInitialSnippets(data.snippets, projectRef)
      }
    },
  })

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

  // async function formatPgsql(value: any) {
  //   try {
  //     const formatted = await meta.formatQuery(value)
  //     if (formatted.error) throw formatted.error
  //     return formatted
  //   } catch (error) {
  //     console.error('formatPgsql error:', error)
  //     return value
  //   }
  // }

  // useEffect(() => {
  //   if (monaco) {
  //     // Enable pgsql format
  //     const formatProvider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
  //       async provideDocumentFormattingEdits(model: any) {
  //         const value = model.getValue()
  //         const formatted = await formatPgsql(value)
  //         return [
  //           {
  //             range: model.getFullModelRange(),
  //             text: formatted,
  //           },
  //         ]
  //       },
  //     })

  //     // register completion item provider for pgsql
  //     const completeProvider = monaco.languages.registerCompletionItemProvider(
  //       'pgsql',
  //       getPgsqlCompletionProvider(monaco, sqlEditorStore)
  //     )
  //     const signatureHelpProvider = monaco.languages.registerSignatureHelpProvider(
  //       'pgsql',
  //       getPgsqlSignatureHelpProvider(monaco, sqlEditorStore)
  //     )

  //     return () => {
  //       formatProvider.dispose()
  //       completeProvider.dispose()
  //       signatureHelpProvider.dispose()
  //     }
  //   }
  // }, [monaco])

  // Todo: handle 404 state

  return (
    <div className="SQLTabContainer flex-1">
      <SQLEditor key={id} id={id} isLoading={!(id && projectRef && snap.loaded[projectRef])} />
    </div>
  )
}

SqlEditorQueryPage.getLayout = (page) => <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>

export default SqlEditorQueryPage
