'use client'

import { useConfig } from '@/src/hooks/use-config'
import useShortcut from '@/src/hooks/use-shortcut'
import { useParams, usePathname } from 'next/navigation'
import {
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  Separator,
  cn,
} from 'ui'
import { useHotkeys } from 'react-hotkeys-hook'
import { ChevronRight, Search } from 'lucide-react'
import { Input } from 'ui-patterns/DataInputs/Input'

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
        'transition-all',
        'py-3'
      )}
    >
      <Collapsible_Shadcn_
        className="group pb-3"
        open={config.tableEditor.itemsOpen}
        onOpenChange={() =>
          setConfig({
            ...config,
            tableEditor: {
              ...config.tableEditor,
              itemsOpen: !config.tableEditor.itemsOpen,
            },
          })
        }
      >
        <CollapsibleTrigger_Shadcn_ className="px-3 text-sm uppercase text-foreground-muted font-mono flex gap-3 items-center">
          <ChevronRight
            size={14}
            className="group-data-[state=open]:rotate-90 transform transition-all"
          />
          Items
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_>
          <div className="px-3 py-3 flex flex-col gap-2">
            <Button type="default" className="justify-start">
              <span className="text-foreground-lighter">Schema</span> <span>public</span>
            </Button>
            <Input
              icon={<Search size={13} className="text-foreground-muted" />}
              placeholder="Search tables..."
              size="tiny"
            />
          </div>
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>
      <Separator />
      <Collapsible_Shadcn_
        className="group py-3"
        open={config.tableEditor.queriesOpen}
        onOpenChange={() =>
          setConfig({
            ...config,
            tableEditor: {
              ...config.tableEditor,
              queriesOpen: !config.tableEditor.queriesOpen,
            },
          })
        }
      >
        <CollapsibleTrigger_Shadcn_ className="px-3 text-sm uppercase text-foreground-muted font-mono flex gap-3 items-center">
          <ChevronRight
            size={14}
            className="group-data-[state=open]:rotate-90 transform transition-all"
          />
          Queries
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_>
          <div className="px-3 py-3 flex flex-col gap-2">
            <Button type="default" className="justify-start">
              <span className="text-foreground-lighter">Schema</span> <span>public</span>
            </Button>
            <Input
              icon={<Search size={13} className="text-foreground-muted" />}
              placeholder="Search tables..."
              size="tiny"
            />
          </div>
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>
    </div>
  )
}
