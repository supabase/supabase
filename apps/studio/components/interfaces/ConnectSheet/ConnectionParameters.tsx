import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn, copyToClipboard } from 'ui'

interface Parameter {
  key: string
  value: string
}

interface ConnectionParametersProps {
  parameters: Parameter[]
}

export const ConnectionParameters = ({ parameters }: ConnectionParametersProps) => {
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({})

  return (
    <div className="bg-surface-75 rounded-lg border font-mono text-sm p-4">
      {parameters.map((param) => (
        <div key={param.key} className="py-0.5 group/param">
          <div className="text-xs flex items-center">
            <span className="text-foreground-lighter">{param.key}: </span>
            <span className="ml-1 text-foreground">{param.value}</span>
            <button
              onClick={() => {
                copyToClipboard(param.value, () => {
                  setCopiedMap((prev) => ({ ...prev, [param.key]: true }))
                  setTimeout(() => {
                    setCopiedMap((prev) => ({ ...prev, [param.key]: false }))
                  }, 1000)
                })
              }}
              className={cn(
                'text-foreground-lighter',
                'ml-2 opacity-0 group-hover/param:opacity-100',
                'hover:text-foreground rounded-sm p-1',
                copiedMap[param.key] && 'opacity-100',
                'transition-all'
              )}
            >
              {copiedMap[param.key] ? (
                <Check size={12} strokeWidth={1.5} />
              ) : (
                <Copy size={12} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
