import { IconCheck, IconClipboard } from '@supabase/ui'
import { useState } from 'react'

const CommandRender = ({ commands }: any) => {
  console.log('commands', commands)
  return (
    <div className="space-y-4">
      {commands.map((item: any) => {
        const [isCopied, setIsCopied] = useState(false)
        return (
          <div>
            <span className="font-mono text-xs text-scale-900">{`> ${item.comment}`}</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-scale-1200 font-mono text-sm font-normal">
                <span className="text-scale-900">$</span>
                {item.jsx ? item.jsx() : null}
              </div>
              <button
                type="button"
                className="text-scale-900 hover:text-scale-1200"
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
                  <div className="text-brand-900">
                    <IconCheck size={14} strokeWidth={3} />
                  </div>
                ) : (
                  <IconClipboard size={14} />
                )}
              </button>
            </div>
            <span className="text-xs text-scale-900">{item.description}</span>
          </div>
        )
      })}
    </div>
  )
}

export default CommandRender
