import { Check, Clipboard } from 'lucide-react'
import { forwardRef, useState } from 'react'
import { cn } from 'ui'

const CommandRender = forwardRef<HTMLDivElement, { commands: any[]; className?: string }>(
  ({ commands, className }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {commands.map((item: any, idx: number) => (
          <Command key={`command-${idx}`} item={item} />
        ))}
      </div>
    )
  }
)

CommandRender.displayName = 'CommandRender'

export default CommandRender

const Command = ({ item }: any) => {
  const [isCopied, setIsCopied] = useState(false)

  return (
    <div className="space-y-1">
      <span className="font-mono text-sm text-foreground-lighter">{`> ${item.comment}`}</span>
      <div className="flex items-center gap-2">
        <div className="flex gap-2 font-mono text-sm font-normal text-foreground">
          <span className="text-foreground-lighter">$</span>
          <span>
            <span>{item.jsx ? item.jsx() : null} </span>
            <button
              type="button"
              className="text-foreground-lighter hover:text-foreground"
              onClick={() => {
                function onCopy(value: any) {
                  setIsCopied(true)
                  navigator.clipboard.writeText(value).then()
                  setTimeout(function () {
                    setIsCopied(false)
                  }, 3000)
                }
                onCopy(item.command)
              }}
            >
              {isCopied ? (
                <Check size={14} strokeWidth={3} className="text-brand" />
              ) : (
                <Clipboard size={14} />
              )}
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
