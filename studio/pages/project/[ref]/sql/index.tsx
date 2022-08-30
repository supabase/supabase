import React, { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useMonaco } from '@monaco-editor/react'
import { useSqlStore, TAB_TYPES } from 'localStores/sqlEditor/SqlEditorStore'
import TabWelcome from 'components/to-be-cleaned/SqlEditor/TabWelcome'
import TabSqlQuery from 'components/to-be-cleaned/SqlEditor/TabSqlQuery'
import getPgsqlCompletionProvider from 'components/to-be-cleaned/SqlEditor/PgsqlCompletionProvider'
import getPgsqlSignatureHelpProvider from 'components/to-be-cleaned/SqlEditor/PgsqlSignatureHelpProvider'
import { useStore } from 'hooks'
import { SQLEditorLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const SqlEditor: NextPageWithLayout = () => {
  const { meta, ui } = useStore()
  const { isDarkTheme } = ui
  const sqlEditorStore: any = useSqlStore()
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
    }
  }, [monaco, isDarkTheme])

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

  function renderTabContent() {
    const tabInfo = sqlEditorStore.activeTab
    if (!tabInfo) return null

    const { type } = tabInfo
    switch (type) {
      case TAB_TYPES.WELCOME:
        return <TabWelcome />
      case TAB_TYPES.SQL_QUERY:
        return (
          <div className="SQLTabContainer flex-1">
            <TabSqlQuery />
          </div>
        )
    }
  }

  return <>{renderTabContent()}</>
}

SqlEditor.getLayout = (page) => <SQLEditorLayout title="SQL">{page}</SQLEditorLayout>

export default observer(SqlEditor)
