'use client'

import { useConfig } from '@/src/hooks/use-config'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from 'ui'

export default function TabHeader() {
  const [config, setConfig] = useConfig()
  return (
    <div className="w-full bg-surface-100 h-8 border-b items-center flex px-3">
      {config.tableEditor.sidePanelOpen ? (
        <PanelLeftClose
          size={16}
          strokeWidth={1.5}
          className={cn(
            'text-foreground-muted hover:text-foreground-light transition-colors cursor-pointer'
          )}
          onClick={() =>
            setConfig({
              ...config,
              tableEditor: {
                ...config.tableEditor,
                sidePanelOpen: false,
              },
            })
          }
        />
      ) : (
        <PanelLeftOpen
          size={16}
          strokeWidth={1.5}
          className={cn(
            'text-foreground-muted hover:text-foreground-light transition-colors cursor-pointer'
          )}
          onClick={() =>
            setConfig({
              ...config,
              tableEditor: {
                ...config.tableEditor,
                sidePanelOpen: true,
              },
            })
          }
        />
      )}
    </div>
  )
}
