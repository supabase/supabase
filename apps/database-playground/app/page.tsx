'use client'

import { FunctionBinding, executeJS } from 'ai-sandbox'
import { useChat } from 'ai/react'
import { ArrowUp } from 'lucide-react'
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { CodeBlock, markdownComponents } from 'ui'
import { Button } from 'ui/src/components/shadcn/ui/button'
import { Input } from 'ui/src/components/shadcn/ui/input'

export default function Page() {
  const functionBindings: Record<string, FunctionBinding> = useMemo(() => {
    return {}
  }, [])

  const expose = useMemo(() => {
    return Object.entries(functionBindings).reduce(
      (merged, [name, { fn }]) => ({
        ...merged,
        [name]: fn,
      }),
      {}
    )
  }, [functionBindings])

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: 'api/plan',
    body: {
      functionBindings,
    },
    maxToolRoundtrips: 5,
    async onToolCall({ toolCall }) {
      console.log('tool', toolCall)
      if (toolCall.toolName === 'interpret') {
        const args: any = toolCall.args
        const { exports, error } = await executeJS(args.source, {
          expose,
        })

        if (error) {
          // Make `message` enumerable so that it gets serialized
          Object.defineProperty(error, 'message', {
            enumerable: true,
          })
        }

        const result = error ?? exports

        return result
      }
    },
  })

  return (
    <div className="w-full h-full max-h-full flex flex-col items-stretch">
      <div className="flex-1 flex flex-col items-center overflow-y-auto">
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
                  <div key={message.id} className="self-stretch flex flex-col items-stretch gap-4">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }]]}
                      rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                      components={markdownComponents}
                      className="prose [&_.katex-display>.katex]:text-left"
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.toolInvocations &&
                      message.toolInvocations.map((invocation) => (
                        <div key={invocation.toolCallId}>
                          <div className="flex items-center px-3 py-2 bg-neutral-600 text-white text-xs rounded-t-md">
                            <h3>JavaScript (Interpreter)</h3>
                          </div>
                          <div className="">
                            <div className="py-4 bg-neutral-100">
                              <CodeBlock className="language-js border-none p-0">
                                {invocation.args.source}
                              </CodeBlock>
                            </div>
                            {'result' in invocation && (
                              <div className="bg-white p-4 border border-neutral-100 rounded-b-md">
                                <CodeBlock className="language-js border-none p-0" hideLineNumbers>
                                  {JSON.stringify(invocation.result, undefined, 2)}
                                </CodeBlock>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )
            }
          })}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 pb-2">
        <form
          className="flex items-center py-2 px-3 rounded-full bg-neutral-100 w-full max-w-4xl"
          onSubmit={handleSubmit}
        >
          <Input
            className="flex-grow border-none text-base placeholder:text-neutral-400"
            name="prompt"
            value={input}
            onChange={handleInputChange}
            placeholder="Message Supabase AI"
            id="input"
          />
          <Button className="rounded-full w-8 h-8 p-1.5 text-white bg-neutral-800" type="submit">
            <ArrowUp />
          </Button>
        </form>
        <div className="text-xs text-neutral-400">
          AI can make mistakes. Check import information.
        </div>
      </div>
    </div>
  )
}
