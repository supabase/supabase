import {
  CopyIcon,
  CornerDownRightIcon,
  DownloadIcon,
  EditIcon,
  LockIcon,
  TrashIcon,
} from 'lucide-react'
import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'ui'

import type { EntityAction, EntityActionGroup, EntityActionId } from './EntityActions.utils'

const ICONS: Partial<Record<EntityActionId, ReactNode>> = {
  'copy-name': <CopyIcon size={12} className="shrink-0" />,
  'copy-schema': <CopyIcon size={12} className="shrink-0" />,
  'copy-definition': <CopyIcon size={12} className="shrink-0" />,
  'duplicate-table': <CopyIcon size={12} className="shrink-0" />,
  'edit-table': <EditIcon size={12} className="shrink-0" />,
  'view-policies': <LockIcon size={12} className="shrink-0" />,
  export: <DownloadIcon size={12} className="shrink-0" />,
  'view-partitions': <CornerDownRightIcon size={12} className="shrink-0" />,
  delete: <TrashIcon size={12} className="shrink-0" />,
}

const MENU_COMPONENTS = {
  dropdown: {
    Item: DropdownMenuItem,
    Separator: DropdownMenuSeparator,
    Sub: DropdownMenuSub,
    SubTrigger: DropdownMenuSubTrigger,
    SubContent: DropdownMenuSubContent,
  },
  context: {
    Item: ContextMenuItem,
    Separator: ContextMenuSeparator,
    Sub: ContextMenuSub,
    SubTrigger: ContextMenuSubTrigger,
    SubContent: ContextMenuSubContent,
  },
}

interface EntityActionMenuItemsProps {
  variant: keyof typeof MENU_COMPONENTS
  groups: EntityActionGroup[]
  onSelectAction: (id: EntityActionId) => void
}

export const EntityActionMenuItems = ({
  variant,
  groups,
  onSelectAction,
}: EntityActionMenuItemsProps) => {
  const { Item, Separator, Sub, SubTrigger, SubContent } = MENU_COMPONENTS[variant]

  const renderAction = (action: EntityAction) => {
    if (action.children) {
      return (
        <Sub key={action.id}>
          <SubTrigger className="gap-x-2">
            {ICONS[action.id]}
            {action.label}
          </SubTrigger>
          <SubContent>{action.children.map(renderAction)}</SubContent>
        </Sub>
      )
    }

    const content = (
      <>
        {ICONS[action.id]}
        <span>{action.label}</span>
      </>
    )

    if (action.href !== undefined) {
      return (
        <Item key={action.id} className="gap-x-2" asChild>
          <Link href={action.href}>{content}</Link>
        </Item>
      )
    }

    return (
      <Item key={action.id} className="gap-x-2" onSelect={() => onSelectAction(action.id)}>
        {content}
      </Item>
    )
  }

  return (
    <>
      {groups.map((group, index) => (
        <Fragment key={group[0].id}>
          {index > 0 && <Separator />}
          {group.map(renderAction)}
        </Fragment>
      ))}
    </>
  )
}
