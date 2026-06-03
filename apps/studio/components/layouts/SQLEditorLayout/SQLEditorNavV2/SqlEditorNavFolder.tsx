import { ReactNode } from 'react'
import { cn, Collapsible, CollapsibleContent } from 'ui'

import {
  SQL_EDITOR_NAV_LIST_GAP_CLASSNAME,
  SQL_EDITOR_NAV_LIST_INSET_CLASSNAME,
} from './SQLEditorNav.constants'
import { SqlEditorNavFolderTrigger } from './SqlEditorNavItem'

interface SqlEditorNavFolderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  actions?: ReactNode
  depth?: number
  children: ReactNode
}

export function SqlEditorNavFolder({
  open,
  onOpenChange,
  title,
  actions,
  depth = 0,
  children,
}: SqlEditorNavFolderProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="w-full">
      <div className={cn('flex w-full items-center', SQL_EDITOR_NAV_LIST_INSET_CLASSNAME)}>
        <SqlEditorNavFolderTrigger depth={depth} open={open} label={title} />
        {actions}
      </div>
      {open ? (
        <CollapsibleContent
          className={cn(
            'flex flex-col',
            SQL_EDITOR_NAV_LIST_GAP_CLASSNAME,
            SQL_EDITOR_NAV_LIST_INSET_CLASSNAME
          )}
        >
          {children}
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  )
}
