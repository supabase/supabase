import Editor, { useMonaco } from '@monaco-editor/react'
import { stripIndent } from 'common-tags'
import { ChevronUp } from 'lucide-react'
import type { editor } from 'monaco-editor'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Statement, processSql, renderHttp, renderSupabaseJs } from 'sql-to-rest'
import { CodeBlock, Collapsible, Tabs, cn } from 'ui'

const defaultValue = `select
  *
from
  books
where
  title = 'Cheese'
`

type Faq = {
  condition: (statement: Statement) => boolean
  question: string
  answer: string
}

const faqs: Faq[] = [
  {
    condition: (statement: Statement) => statement.targets.some((target) => target.alias),
    question: 'Why is my alias lower case?',
    answer: stripIndent`
      Postgres converts all identifiers to lowercase by default. To keep casing, wrap your alias in double quotes.
    `,
  },
]

export default function SqlToRest() {
  const [sql, setSql] = useState(defaultValue)
  const [httpRequest, setHttpRequest] = useState('')
  const [curlRequest, setCurlRequest] = useState('')
  const [jsCode, setJsCode] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()
  const [relevantFaqs, setRelevantFaqs] = useState<Faq[]>([])

  const monaco = useMonaco()
  const { theme } = useTheme()
  const isDark = theme?.includes('dark') ?? true

  useLayoutEffect(() => {
    if (monaco && theme) {
      const lightMode = getTheme(false)
      const darkMode = getTheme(true)
      monaco.editor.defineTheme('supabase-light', lightMode)
      monaco.editor.defineTheme('supabase-dark', darkMode)
    }
  }, [theme, monaco])

  const process = useCallback(async (sql: string) => {
    setSql(sql)

    try {
      const statement = await processSql(sql)
      const { method, path } = await renderHttp(statement)
      const { code } = await renderSupabaseJs(statement)

      setErrorMessage(undefined)
      setHttpRequest(`${method} ${path}`)
      setCurlRequest(`curl -X ${method} ${path}`)
      setJsCode(code)
      setRelevantFaqs(faqs.filter((faq) => faq.condition(statement)))
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
    <div className="flex justify-between gap-4 mt-4">
      <div className="flex-1 flex flex-col gap-4">
        <div>Enter SQL to convert:</div>
        <div
          className={cn('h-96 py-4 border rounded-md', isDark ? 'bg-[#1f1f1f]' : 'bg-[#f0f0f0]')}
        >
          <Editor
            language="pgsql"
            theme={isDark ? 'supabase-dark' : 'supabase-light'}
            value={sql}
            options={{
              tabSize: 2,
              minimap: {
                enabled: false,
              },
              fontSize: 13,
            }}
            onChange={async (sql) => {
              if (!sql) {
                return
              }
              await process(sql)
            }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <Tabs defaultActiveId="http" queryGroup="language">
          <Tabs.Panel id="http" label="HTTP" className="flex flex-col gap-4">
            <CodeBlock language="bash" hideLineNumbers className="self-stretch">
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

        {relevantFaqs.map((faq) => (
          <Collapsible className="flex flex-col items-stretch justify-start bg-surface-100 rounded border border-default px-4">
            <Collapsible.Trigger asChild>
              <button type="button" className="flex justify-between items-center p-3">
                <span className="text-sm">{faq.question}</span>
                <ChevronUp className="transition data-open-parent:rotate-0 data-closed-parent:rotate-180" />
              </button>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <div className="text-foreground flex flex-col justify-start items-center px-3 pb-4">
                <p className="text-sm m-0">{faq.answer}</p>
              </div>
            </Collapsible.Content>
          </Collapsible>
        ))}
      </div>
    </div>
  )
}

// TODO: this was copied from studio - find a way to share it between sites
export const getTheme = (isDarkMode: boolean): editor.IStandaloneThemeData => {
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
