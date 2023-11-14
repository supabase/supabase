import { useState } from 'react'
import { IconCheck, IconClipboard } from 'ui'

const CommandRender = ({ commands }: any) => {
  return (
    <div className="space-y-4">
      {commands.map((item: any, idx: number) => {
        return <Command key={`command-${idx}`} item={item} />
      })}
    </div>
  )
}

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
            <span className="">{item.jsx ? item.jsx() : null} </span>
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
                <div className="text-brand">
                  <IconCheck size={14} strokeWidth={3} />
                </div>
              ) : (
                <div className="relative">
                  <div className="block">
                    <IconClipboard size={14} />
                  </div>
                </div>
              )}
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
