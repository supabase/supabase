import React, { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useMonaco } from '@monaco-editor/react'
import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'
import getPgsqlCompletionProvider from 'components/to-be-cleaned/SqlEditor/PgsqlCompletionProvider'
import getPgsqlSignatureHelpProvider from 'components/to-be-cleaned/SqlEditor/PgsqlSignatureHelpProvider'
import { useStore } from 'hooks'
import { SQLEditorLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'
import { useTheme } from 'common'
import SQLEditor from 'components/interfaces/SQLEditor/SQLEditor'

const SqlEditor: NextPageWithLayout = () => {
  const { meta } = useStore()
  const { isDarkMode } = useTheme()
  const sqlEditorStore: any = useSqlStore()
  const monaco = useMonaco()

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('supabase', {
        base: isDarkMode ? 'vs-dark' : 'vs', // can also be hc-black
        inherit: true, // can also be false to completely replace the builtin rules
        rules: [
          { token: '', background: isDarkMode ? '1f1f1f' : 'f0f0f0' },
          { token: 'string.sql', foreground: '24b47e' },
          { token: 'comment', foreground: '666666' },
          // { token: 'predefined.sql', foreground: 'D4D4D4' },
        ],
        colors: {
          'editor.background': isDarkMode ? '#1f1f1f' : '#f0f0f0',
          // 'editorGutter.background': '#30313f',
          // 'editorLineNumber.foreground': '#555671',
        },
      })
    }
  }, [monaco, isDarkMode])

  useEffect(() => {
    if (monaco) {
      // Enable pgsql format
      const formatprovider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model: any) {
          const value = model.getValue()
          const formatted = await formatPgsql(value)
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ]
        },
      })

      // register completion item provider for pgsql
      const completeProvider = monaco.languages.registerCompletionItemProvider(
        'pgsql',
        getPgsqlCompletionProvider(monaco, sqlEditorStore)
      )
      const signatureHelpProvider = monaco.languages.registerSignatureHelpProvider(
        'pgsql',
        getPgsqlSignatureHelpProvider(monaco, sqlEditorStore)
      )

      return () => {
        formatprovider.dispose()
        completeProvider.dispose()
        signatureHelpProvider.dispose()
      }
    }
  }, [monaco])

  async function formatPgsql(value: any) {
    try {
      const formatted = await meta.formatQuery(value)
      if (formatted.error) throw formatted.error
      return formatted
    } catch (error) {
      console.error('formatPgsql error:', error)
      return value
    }
  }

  return (
    <div className="SQLTabContainer flex-1">
      <SQLEditor />
    </div>
  )
}

SqlEditor.getLayout = (page) => <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>

export default observer(SqlEditor)
