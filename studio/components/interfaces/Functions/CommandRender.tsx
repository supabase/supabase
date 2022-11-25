import { IconCheck, IconClipboard } from 'ui'
import { useState } from 'react'

const CommandRender = ({ commands }: any) => {
  return (
    <div className="space-y-4">
      {commands.map((item: any, idx: number) => {
        const [isCopied, setIsCopied] = useState(false)
        return (
          <div key={`command-${idx}`} className="space-y-1">
            <span className="font-mono text-sm text-scale-900">{`> ${item.comment}`}</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 font-mono text-sm font-normal text-scale-1200">
                <span className="text-scale-900">$</span>
                <span>
                  <span className="">{item.jsx ? item.jsx() : null} </span>
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
      })}
    </div>
  )
}

export default CommandRender
