'use client'

import { useConfig } from '@/src/hooks/use-config'
import { PanelLeftClose, PanelLeftOpen, PlusCircle } from 'lucide-react'
import { cn } from 'ui'

export default function TabHeader() {
  const [config, setConfig] = useConfig()
  return (
    <div className="w-full bg-surface-100 h-[48px] border-b items-center flex px-3 gap-3 z-10">
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
      <div className="flex gap-2">
        <button className="rounded-full h-[26px] px-3 border border-dashed border-strong text-xs text-foreground-light flex items-center gap-2 pl-1">
          <PlusCircle size={18} className="text-foreground-muted" strokeWidth={1.3} />
          Sort
        </button>
        <button className="rounded-full h-[26px] px-3 border border-dashed border-strong text-xs text-foreground-light flex items-center gap-2 pl-1">
          <PlusCircle size={18} className="text-foreground-muted" strokeWidth={1.3} />
          Filter
        </button>
      </div>
    </div>
  )
}
