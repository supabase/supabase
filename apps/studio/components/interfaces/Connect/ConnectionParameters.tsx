import { Check, ChevronRight, Copy } from 'lucide-react'
import { useState } from 'react'

import { copyToClipboard } from 'lib/helpers'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Separator,
} from 'ui'

interface Parameter {
  key: string
  value: string
  description?: string
}

interface ConnectionParametersProps {
  parameters: Parameter[]
}

export const ConnectionParameters = ({ parameters }: ConnectionParametersProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({})

  return (
    <Collapsible_Shadcn_ open={isOpen} onOpenChange={setIsOpen} className="group -space-y-px">
      <CollapsibleTrigger_Shadcn_
        asChild
        className="w-full justify-start rounded-t-none !last:rounded-b group-data-[state=open]:rounded-b-none border-light px-3"
      >
        <Button
          type="default"
          size="tiny"
          className="text-foreground-lighter !bg-dash-sidebar"
          icon={
            <ChevronRight
              className={cn(
                'text-foreground-muted transition-transform',
                isOpen ? 'rotate-90' : ''
              )}
            />
          }
        >
          View parameters
        </Button>
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_ className="bg-dash-sidebar rounded-b border font-mono text-sm">
        <div className="px-4 py-2">
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
        <Separator />
        <div className="text-foreground-muted text-xs px-4 py-1 font-sans">
          For security reasons, your database password is never shown.
        </div>
      </CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
}
