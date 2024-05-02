import Editor, { useMonaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { processSql, renderHttp, renderSupabaseJs } from 'sql-to-rest'
import { CodeBlock, Tabs } from 'ui'

const defaultValue = `select
  *
from
  books
where
  title = 'Cheese'
`

export default function SqlToRest() {
  const [sql, setSql] = useState(defaultValue)
  const [httpRequest, setHttpRequest] = useState('')
  const [curlRequest, setCurlRequest] = useState('')
  const [jsCode, setJsCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()

  const monaco = useMonaco()
  const { resolvedTheme } = useTheme()

  useLayoutEffect(() => {
    if (monaco && resolvedTheme) {
      const mode = getTheme(resolvedTheme)
      monaco.editor.defineTheme('supabase', mode)
    }
  }, [resolvedTheme, monaco])

  const process = useCallback(async (sql: string) => {
    console.log({ sql })
    setSql(sql)

    try {
      const statement = await processSql(sql)
      const { method, path } = renderHttp(statement)
      const { code } = renderSupabaseJs(statement)

      setErrorMessage(undefined)
      setHttpRequest(`${method} ${path}`)
      setCurlRequest(`curl -X ${method} ${path}`)
      setJsCode(code)
    } catch (error) {
      if (!(error instanceof Error)) {
        console.error(error)
        return
      }

      setErrorMessage(error.message)
    }
  }, [])

  // Process initial value only
  useEffect(() => {
    process(sql)
  }, [process])

  return (
    <div className="flex justify-between gap-4">
      <div className="flex-1 h-96 py-4 border rounded-md bg-[#1e1e1e]">
        <Editor
          language="pgsql"
          theme="supabase"
          value={sql}
          options={{
            tabSize: 2,
            minimap: {
              enabled: false,
            },
          }}
          onChange={async (sql) => {
            if (!sql) {
              return
            }
            await process(sql)
          }}
        />
      </div>

      <div className="flex-1 flex-col gap-2">
        <Tabs defaultActiveId="http">
          <Tabs.Panel id="http" label="HTTP" className="flex flex-col gap-4">
            <CodeBlock language="bash" hideLineNumbers className="self-stretch" hideCopy>
              {httpRequest}
            </CodeBlock>
          </Tabs.Panel>
          <Tabs.Panel id="curl" label="cURL" className="flex flex-col gap-4">
            <CodeBlock language="bash" hideLineNumbers className="self-stretch">
              {curlRequest}
            </CodeBlock>
          </Tabs.Panel>
          <Tabs.Panel id="js" label="JavaScript">
            <CodeBlock language="js" hideLineNumbers className="self-stretch">
              {jsCode}
            </CodeBlock>
          </Tabs.Panel>
        </Tabs>
        {errorMessage && <div className="text-red-900">{errorMessage}</div>}
      </div>
    </div>
  )
}

// TODO: this was copied from studio - find a way to share it between sites
export const getTheme = (theme: string): editor.IStandaloneThemeData => {
  const isDarkMode = theme.includes('dark')
  // [TODO] Probably need better theming for light mode
  return {
    base: isDarkMode ? 'vs-dark' : 'vs', // can also be vs-dark or hc-black
    inherit: true, // can also be false to completely replace the builtin rules
    rules: [
      {
        token: '',
        background: isDarkMode ? '1f1f1f' : 'f0f0f0',
        foreground: isDarkMode ? 'd4d4d4' : '444444',
      },
      { token: 'string.sql', foreground: '24b47e' },
      { token: 'comment', foreground: '666666' },
      { token: 'predefined.sql', foreground: isDarkMode ? 'D4D4D4' : '444444' },
    ],
    colors: { 'editor.background': isDarkMode ? '#1f1f1f' : '#f0f0f0' },
  }
}
