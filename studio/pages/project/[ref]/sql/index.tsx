import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { useMonaco } from '@monaco-editor/react'

import {
  useSqlEditorStore,
  SqlEditorContext,
  useSqlStore,
  TAB_TYPES,
} from 'localStores/sqlEditor/SqlEditorStore'
import TabWelcome from 'components/to-be-cleaned/SqlEditor/TabWelcome'
import TabSqlQuery from 'components/to-be-cleaned/SqlEditor/TabSqlQuery'
import getPgsqlCompletionProvider from 'components/to-be-cleaned/SqlEditor/PgsqlCompletionProvider'
import getPgsqlSignatureHelpProvider from 'components/to-be-cleaned/SqlEditor/PgsqlSignatureHelpProvider'

import { useProjectContentStore } from 'stores/projectContentStore'

import { useStore, withAuth, useProfile } from 'hooks'
import { SQLEditorLayout } from 'components/layouts'

const PageConfig = () => {
  const router = useRouter()
  const { ref } = router.query

  const { meta } = useStore()
  const { profile: user } = useProfile()
  const contentStore: any = useProjectContentStore(ref)
  const sqlEditorStore: any = useSqlEditorStore(ref, meta)

  useEffect(() => {
    /*
     * Load persited data
     */
    loadPersistantData()
  }, [ref])

  /*
   * Load persited data
   */
  async function loadPersistantData() {
    if (sqlEditorStore === undefined) return
    sqlEditorStore.loadRemotePersistentData(contentStore, (user as any)?.id)
  }

  return (
    <SqlEditorContext.Provider value={sqlEditorStore}>
      <PageLayout />
    </SqlEditorContext.Provider>
  )
}

export default withAuth(observer(PageConfig))

const PageLayout = observer(() => {
  return (
    <SQLEditorLayout title="SQL">
      <SqlEditor />
    </SQLEditorLayout>
  )
})

const SqlEditor = observer(() => {
  const { meta } = useStore()
  const sqlEditorStore: any = useSqlStore()
  const monaco = useMonaco()
  const [theme, setTheme] = useState(localStorage.getItem('theme'))

  useEffect(() => {
    if (monaco) {
      const darkTheme = theme ? (theme === 'dark' ? true : false) : true

      monaco.editor.defineTheme('supabase', {
        base: 'vs-dark', // can also be vs-dark or hc-black
        inherit: true, // can also be false to completely replace the builtin rules
        rules: [
          { token: '', background: darkTheme ? '1f1f1f' : '30313f' },
          { token: 'string.sql', foreground: '24b47e' },
          { token: 'comment', foreground: '666666' },
          { token: 'predefined.sql', foreground: 'D4D4D4' },
        ],
        colors: {
          'editor.background': darkTheme ? '#1f1f1f' : '#30313f',
          // 'editorGutter.background': '#30313f',
          // 'editorLineNumber.foreground': '#555671',
        },
      })
    }
  }, [theme, monaco])

  useEffect(() => {
    if (monaco) {
      // Enable pgsql format
      const formatprovider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model) {
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
})
