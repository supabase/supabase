import * as Tooltip from '@radix-ui/react-tooltip'
import dayjs from 'dayjs'
import { kebabCase, noop, take } from 'lodash'
import { Copy, FileDiff } from 'lucide-react'
import Image from 'next/image'
import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { format } from 'sql-formatter'
import { AiIcon, AiIconAnimation, Badge, Button } from 'ui'

import CodeEditor from 'components/ui/CodeEditor'
import { useProfile } from 'lib/profile'

const Message = memo(function Message({
  name,
  role,
  content,
  createdAt,
  isDebug,
  onDiff = noop,
}: {
  name?: string
  role: 'user' | 'assistant'
  content?: string
  createdAt?: number
  isDebug?: boolean
  onDiff?: (s: string) => void
}) {
  const { profile } = useProfile()

  const icon = useMemo(() => {
    return role === 'assistant' ? (
      <AiIconAnimation
        loading={content === 'Thinking...'}
        className="[&>div>div]:border-black dark:[&>div>div]:border-white"
      />
    ) : (
      <div className="relative border shadow-lg w-8 h-8 rounded-full overflow-hidden">
        <Image
          src={`https://github.com/${profile?.username}.png` || ''}
          width={30}
          height={30}
          alt="avatar"
          className="relative"
        />
      </div>
    )
  }, [role])

  if (!content) return null

  return (
    <div className="flex flex-col py-4 gap-4 border-t px-5">
      <div className="flex flex-row gap-3 items-center">
        {icon}
        <span className="text-sm">{role === 'assistant' ? 'Assistant' : name ? name : 'You'}</span>
        {createdAt && (
          <span className="text-xs text-foreground-muted">{dayjs(createdAt * 1000).fromNow()}</span>
        )}
        {isDebug && <Badge color="amber">Debug request</Badge>}
      </div>
      <ReactMarkdown
        className="gap-2.5 flex flex-col"
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
              <div
                className="rounded-md border border-control overflow-hidden relative group"
                key={key}
              >
                <CodeEditor
                  id={`rls-sql_${key}`}
                  language="pgsql"
                  className="h-48"
                  value={formatted}
                  autofocus={false}
                  options={{
                    scrollBeyondLastLine: false,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 3,
                  }}
                />
                <div className="absolute top-3 right-3 bg-surface-100 border-muted border rounded-lg h-[28px] hidden group-hover:block">
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger>
                      <Button type="text" size="tiny" onClick={() => onDiff(formatted)}>
                        <FileDiff className="h-4 w-4" />
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content side="bottom">
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                        <div
                          className={[
                            'rounded bg-alternative py-1 px-2 leading-none shadow',
                            'border border-background',
                          ].join(' ')}
                        >
                          <span className="text-xs text-foreground">Apply changes</span>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger>
                      <Button
                        type="text"
                        size="tiny"
                        onClick={() => navigator.clipboard.writeText(formatted).then()}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content side="bottom">
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                        <div
                          className={[
                            'rounded bg-alternative py-1 px-2 leading-none shadow',
                            'border border-background',
                          ].join(' ')}
                        >
                          <span className="text-xs text-foreground">Copy code</span>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
              </div>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})

export default Message
