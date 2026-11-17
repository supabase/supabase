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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
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
  /** Which menu primitives to render with: the row's "more options" dropdown or its context menu */
  variant: keyof typeof MENU_COMPONENTS
  groups: EntityActionGroup[]
  onSelectAction: (id: EntityActionId) => void
}

/**
 * Renders the actions from `getEntityActions` as menu items. Holds no action logic of its own, so
 * the dropdown and the context menu can't drift apart.
 */
export const EntityActionMenuItems = ({
  variant,
  groups,
  onSelectAction,
}: EntityActionMenuItemsProps) => {
  const { Item, Separator, Sub, SubTrigger, SubContent } = MENU_COMPONENTS[variant]

  // The menu content is portalled but still bubbles React events to the row's link, which would
  // navigate to the table. Items stop propagation for that reason.
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

    const item = (
      <Item
        key={action.id}
        className="gap-x-2"
        disabled={action.disabledReason !== undefined}
        onClick={(e) => e.stopPropagation()}
        onSelect={() => onSelectAction(action.id)}
      >
        {content}
      </Item>
    )

    if (action.disabledReason === undefined) return item

    // Disabled items don't receive pointer events, so the tooltip hangs off a wrapper
    return (
      <Tooltip key={action.id}>
        <TooltipTrigger asChild>
          <div>{item}</div>
        </TooltipTrigger>
        <TooltipContent side="right">{action.disabledReason}</TooltipContent>
      </Tooltip>
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
