import dayjs from 'dayjs'
import { kebabCase, take } from 'lodash'
import { Copy, FileDiff } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { format } from 'sql-formatter'
import { Button } from 'ui'

import CodeEditor from 'components/ui/CodeEditor'

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

export default Message
