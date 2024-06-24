'use client'

import { useConfig } from '@/src/hooks/use-config'
import useShortcut from '@/src/hooks/use-shortcut'
import { useParams, usePathname } from 'next/navigation'
import { cn } from 'ui'
import { useHotkeys } from 'react-hotkeys-hook'

export default function TableEditorItemsPanel() {
  const { org } = useParams()
  const pathname = usePathname()
  const [config, setConfig] = useConfig()
  const isActive = config.tableEditor.sidePanelOpen

  useHotkeys(
    'meta+b',
    () =>
      setConfig((prev) => ({
        ...prev,
        tableEditor: {
          ...prev.tableEditor,
          sidePanelOpen: !prev.tableEditor.sidePanelOpen,
        },
      })),
    [config.tableEditor.sidePanelOpen]
  )

  return (
    <div
      className={cn(
        'h-full',
        'bg-dash-sidebar',
        //
        isActive ? 'w-[300px]' : 'w-[0px]',
        isActive &&
          `
        border-r 
        `,
        'duration-200',
        'ease-out',
        'transition-all'
      )}
    >
      hello world
    </div>
  )
}
