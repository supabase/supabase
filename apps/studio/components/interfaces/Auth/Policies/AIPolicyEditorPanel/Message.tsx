import dayjs from 'dayjs'
import { kebabCase, noop, take } from 'lodash'
import { Copy, FileDiff } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { format } from 'sql-formatter'
import { Badge, Button } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'

import CodeEditor from 'components/ui/CodeEditor'

const Message = ({
  icon,
  postedBy,
  postedAt,
  message,
  onDiff = noop,
  isDebug = false,
}: {
  icon: React.ReactNode
  postedBy: string
  postedAt?: number
  message: string
  isDebug?: boolean
  onDiff?: (s: string) => void
}) => {
  return (
    <div className="flex flex-col py-4 gap-4 border-t px-5">
      <div className="flex flex-row gap-3 items-center">
        {icon}

        <span className="text-sm">{postedBy}</span>
        {postedAt && (
          <span className="text-xs text-foreground-muted">{dayjs(postedAt * 1000).fromNow()}</span>
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
                  className="h-80"
                  value={formatted}
                  isReadOnly
                  options={{ scrollBeyondLastLine: false }}
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
        {message}
      </ReactMarkdown>
    </div>
  )
}

export default Message
