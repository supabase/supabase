import * as Tooltip from '@radix-ui/react-tooltip'
import { Copy, FileDiff } from 'lucide-react'
import { format } from 'sql-formatter'
import { Button } from 'ui'

import CodeEditor from 'components/ui/CodeEditor'
import { kebabCase, take } from 'lodash'

export const Pre = ({
  id,
  isLoading,
  onDiff,
  code,
}: {
  id: string
  isLoading: boolean
  onDiff: (s: string) => void
  code: string
}) => {
  let formatted = code
  try {
    formatted = format(code)
  } catch {}

  // create a key from the name of the generated policy so that we're sure it's unique
  const key = kebabCase(take(code.split(' '), 3).join(' '))

  return (
    <div className="rounded-md border border-control overflow-hidden relative group">
      <CodeEditor
        id={`rls-sql_${id}_${key}`}
        language={isLoading ? undefined : 'pgsql'}
        className="h-48"
        isReadOnly
        defaultValue=""
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
}
