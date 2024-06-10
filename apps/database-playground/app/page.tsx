'use client'

import { PGlite } from '@electric-sql/pglite'
import { Editor } from '@monaco-editor/react'
import { useChat } from 'ai/react'
import Chart from 'chart.js/auto'
import { ArrowUp } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Chart as ChartWrapper } from 'react-chartjs-2'
import { ErrorBoundary } from 'react-error-boundary'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { format } from 'sql-formatter'
import { markdownComponents } from 'ui'
import { Button } from 'ui/src/components/shadcn/ui/button'

// React's double-rendering in dev mode causes pglite errors
// Temp: storing single instance in module scope
let db: PGlite = new PGlite('idb://local')

export default function Page() {
  const [sql, setSql] = useState('')
  const [isEditorVisible, setIsEditorVisible] = useState(false)

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: 'api/chat',
    maxToolRoundtrips: 5,
    async onToolCall({ toolCall }) {
      console.log('tool call', toolCall)
      switch (toolCall.toolName) {
        case 'getDatabaseSchema': {
          const { sql } = toolCall.args as any
          console.log(sql)
          const results = await db.exec(sql)
          console.log(results)
          return results
        }
        case 'brainstormReports': {
          return 'Reports have been brainstormed. Relay this info to the user.'
        }
        case 'executeSql': {
          const { sql } = toolCall.args as any
          console.log(sql)
          const results = await db.exec(sql)
          console.log(results)
          return results
        }
        case 'generateChart': {
          const { config } = toolCall.args as any

          // Validate that the chart can be rendered without error
          const canvas = document.createElement('canvas')

          try {
            const chart = new Chart(canvas, config)
            chart.destroy()
            return 'Chart has been generated and shown to the user. Say something like, "Above is a chart ...".'
          } catch (err) {
            if (err instanceof Error) {
              return { error: err.message }
            }
            throw err
          } finally {
            canvas.remove()
          }
        }
        case 'appendSqlToMigration': {
          const { sql } = toolCall.args as any
          setSql((s) => {
            const newSql = (s + '\n' + sql).trim()
            return format(newSql, {
              language: 'postgresql',
              keywordCase: 'lower',
              identifierCase: 'lower',
              dataTypeCase: 'lower',
              functionCase: 'lower',
            })
          })
          setIsEditorVisible(true)
          return 'SQL has successfully been appended to the migration file.'
        }
      }
    },
  })

  const scrollRef = useRef<HTMLDivElement>()
  const prevScrollHeightRef = useRef<number>()

  const scrollToBottom = useCallback(() => {
    const scrollElement = scrollRef.current
    if (scrollElement) {
      scrollElement.scrollTo({ top: scrollElement.scrollHeight })
    }
  }, [])

  return (
    <div className="w-full h-full flex p-6">
      {isEditorVisible && (
        <div className="h-full w-[50rem] py-4 rounded-md bg-[#1e1e1e]">
          <Editor
            language="pgsql"
            value={sql}
            theme="vs-dark"
            options={{
              tabSize: 2,
              minimap: {
                enabled: false,
              },
              fontSize: 13,
            }}
            onMount={async (editor, monaco) => {
              // Register pgsql formatter
              monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
                async provideDocumentFormattingEdits(model) {
                  const currentCode = editor.getValue()
                  const formattedCode = format(currentCode, {
                    language: 'postgresql',
                    keywordCase: 'lower',
                  })
                  return [
                    {
                      range: model.getFullModelRange(),
                      text: formattedCode,
                    },
                  ]
                },
              })

              // Format on cmd+s
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
                await editor.getAction('editor.action.formatDocument').run()
              })

              // Run format on the initial value
              await editor.getAction('editor.action.formatDocument').run()
            }}
          />
        </div>
      )}
      <div className="flex-1 h-full flex flex-col items-stretch">
        <div
          className="flex-1 flex flex-col items-center overflow-y-auto"
          ref={(element) => {
            if (element) {
              scrollRef.current = element

              const resizeObserver = new ResizeObserver(() => {
                if (element.scrollHeight !== prevScrollHeightRef.current) {
                  prevScrollHeightRef.current = element.scrollHeight
                  console.log('resize scroll')
                  element.scrollTo({
                    top: element.scrollHeight - element.clientHeight,
                    behavior: 'smooth',
                  })
                }
              })

              for (const child of Array.from(element.children)) {
                resizeObserver.observe(child)
              }
            }
          }}
        >
          <div className="flex flex-col gap-4 w-full max-w-4xl p-10">
            {messages.map((message) => {
              switch (message.role) {
                case 'user':
                  return (
                    <div
                      key={message.id}
                      className="self-end px-5 py-2.5 text-base rounded-full bg-neutral-100"
                    >
                      {message.content}
                    </div>
                  )
                case 'assistant':
                  return (
                    <div
                      key={message.id}
                      className="self-stretch flex flex-col items-stretch gap-6"
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }]]}
                        rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                        components={markdownComponents}
                        className="prose [&_.katex-display>.katex]:text-left"
                      >
                        {message.content}
                      </ReactMarkdown>
                      {message.toolInvocations?.map((toolInvocation) => {
                        switch (toolInvocation.toolName) {
                          case 'generateChart': {
                            const { type, data, options } = toolInvocation.args.config
                            return (
                              <ErrorBoundary
                                key={toolInvocation.toolCallId}
                                fallbackRender={() => (
                                  <div className="bg-warning-300">Error loading chart</div>
                                )}
                              >
                                <ChartWrapper type={type} data={data} options={options} />
                              </ErrorBoundary>
                            )
                          }
                        }
                      })}
                    </div>
                  )
              }
            })}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 pb-2">
          <form
            className="flex items-center py-2 px-3 rounded-full bg-neutral-100 w-full max-w-4xl"
            onSubmit={(e) => {
              handleSubmit(e)
              scrollToBottom()
            }}
          >
            <input
              className="flex-grow border-none focus-visible:ring-0 text-base bg-inherit placeholder:text-neutral-400"
              name="prompt"
              value={input}
              onChange={handleInputChange}
              placeholder="Message Supabase AI"
              autoFocus
              id="input"
            />
            <Button className="rounded-full w-8 h-8 p-1.5 text-white bg-neutral-800" type="submit">
              <ArrowUp />
            </Button>
          </form>
          <div className="text-xs text-neutral-500">
            AI can make mistakes. Check important information.
          </div>
        </div>
      </div>
    </div>
  )
}
