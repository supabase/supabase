import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from 'ui'
import { useSnapshot } from 'valtio'

export function CollapseButton({ hideTabs }: { hideTabs: boolean }) {
  return (
    <button
      className={cn(
        'flex items-center justify-center w-10 h-10 hover:bg-surface-100 shrink-0',
        !hideTabs && 'border-b border-b-default'
      )}
      onClick={() => {
        // handle sidebar collapse here
      }}
    >
      {
        // sidebar.isOpen
        true ? (
          <PanelLeftClose
            size={16}
            strokeWidth={1.5}
            className="text-foreground-lighter hover:text-foreground-light"
          />
        ) : (
          <PanelLeftOpen
            size={16}
            strokeWidth={1.5}
            className="text-foreground-lighter hover:text-foreground-light"
          />
        )
      }
    </button>
  )
}
