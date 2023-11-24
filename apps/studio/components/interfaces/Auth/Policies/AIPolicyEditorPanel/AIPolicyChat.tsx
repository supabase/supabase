import dayjs from 'dayjs'
import { compact, kebabCase, sortBy, take } from 'lodash'
import { Copy, FileDiff } from 'lucide-react'
import Image from 'next/image'
import OpenAI from 'openai'
import { useEffect, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { format } from 'sql-formatter'
import { AiIcon, Button, Input } from 'ui'

import CodeEditor from 'components/ui/CodeEditor'
import { useProfile } from 'lib/profile'

const Avatar = ({ src }: { src: string | undefined }) => {
  return (
    <div className="relative border shadow-lg w-8 h-8 rounded-full overflow-hidden">
      <Image src={src || ''} width={30} height={30} alt="avatar" className="relative" />
    </div>
  )
}

const Message = ({
  icon,
  postedBy,
  postedAt,
  message,
  onDiff,
}: {
  icon: React.ReactNode
  postedBy: string
  postedAt?: number
  message: string
  onDiff: (s: string) => void
}) => {
  return (
    <div className="flex flex-col py-4 gap-4 border-y border px-5">
      <div className="flex flex-row gap-3 items-center">
        {icon}

        <span className="text-sm">{postedBy}</span>
        {postedAt && (
          <span className="text-xs text-foreground-muted">{dayjs(postedAt * 1000).fromNow()}</span>
        )}
      </div>
      <ReactMarkdown
        components={{
          p: ({ children }) => <div className="text-foreground-light text-sm">{children}</div>,
          // intentionally rendering as pre. The other approach would be to render as code element,
          // but that will render <code> elements which appear in the explanations as Monaco editors.
          pre: ({ children }) => {
            const code = (children[0] as any).props.children[0] as string
            let formatted = code
            try {
              formatted = format(code)
            } catch {}

            // create a key from the name of the generated policy so that we're sure it's unique
            const key = kebabCase(take(code.split(' '), 3).join(' '))

            return (
              <div className="relative group" key={key}>
                <CodeEditor
                  id={`rls-sql_${key}`}
                  language="pgsql"
                  className="h-96"
                  value={formatted}
                  isReadOnly
                  options={{ scrollBeyondLastLine: false }}
                />
                <div className="absolute top-3 right-3 bg-surface-100 border-muted border rounded-lg h-[28px] hidden group-hover:block">
                  <Button type="text" size="tiny" onClick={() => onDiff(formatted)}>
                    <FileDiff className="h-4 w-4" />
                  </Button>
                  <Button
                    type="text"
                    size="tiny"
                    onClick={() => navigator.clipboard.writeText(formatted).then()}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          },
        }}
        // {...props}
        className="gap-2.5 flex flex-col"
      >
        {message}
      </ReactMarkdown>
    </div>
  )
}

export const AIPolicyChat = ({
  messages,
  loading,
  onSubmit,
  onDiff,
}: {
  messages: OpenAI.Beta.Threads.Messages.ThreadMessage[]
  loading: boolean
  onSubmit: (s: string) => void
  onDiff: (s: string) => void
}) => {
  const { profile } = useProfile()
  const bottomRef = useRef<HTMLDivElement>(null)
  const name = compact([profile?.first_name, profile?.last_name]).join(' ')
  const sorted = useMemo(() => {
    return sortBy(messages, (m) => m.created_at).filter((m) => {
      if (m.content[0].type === 'text') {
        return !m.content[0].text.value.startsWith('Here is my database schema for reference:')
      }
      return false
    })
  }, [messages])

  useEffect(() => {
    // 👇️ scroll to bottom every time messages change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <Message
          icon={<AiIcon className="[&>div>div]:border-white" />}
          postedBy="Assistant"
          message={`Hi${
            name ? ' ' + name : ''
          }, how can I help you? I'm powered by AI, so surprises and mistakes are possible.
        Make sure to verify any generated code or suggestions, and share feedback so that we can
        learn and improve.`}
          onDiff={() => {}}
        />

        {sorted.map((m) => {
          const content = m.content[0]
          if (content && content.type !== 'text') {
            return <></>
          }

          return (
            <Message
              key={m.id}
              icon={
                m.role === 'assistant' ? (
                  <AiIcon className="[&>div>div]:border-white" />
                ) : (
                  <Avatar src={`https://github.com/${profile?.username}.png`} />
                )
              }
              postedBy={m.role === 'assistant' ? 'Assistant' : name ? name : 'You'}
              postedAt={m.created_at}
              message={content.text.value}
              onDiff={onDiff}
            />
          )
        })}

        <div ref={bottomRef} className="h-1" />
      </div>
      <form
        id="rls-chat"
        onSubmit={(e) => {
          e.preventDefault()
          const value = (e.target as any)['chat-message'].value
          onSubmit(value)
        }}
        className="sticky p-5 flex-0"
      >
        <Input
          id="chat-message"
          icon={<AiIcon className="[&>div>div]:border-white" />}
          placeholder="Ask for some changes to your policy"
          autoFocus
          disabled={loading}
          className="bg-black rounded-full"
          inputClassName="!rounded-full"
        />
      </form>
    </div>
  )
}
