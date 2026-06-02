import { PermissionAction } from '@supabase/shared-types/out/constants'
import { FileBarChart, Trash } from 'lucide-react'
import { useRouter } from 'next/router'
import { cn, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from 'ui'

import { Content } from '@/data/content/content-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useProfile } from '@/lib/profile'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

interface NotebookNavItemProps {
  report: Content
  projectRef: string
  isActive: boolean
  isOpened: boolean
  isPreview: boolean
  onSelectDelete: () => void
}

export const NotebookNavItem = ({
  report,
  projectRef,
  isActive,
  isOpened,
  isPreview,
  onSelectDelete,
}: NotebookNavItemProps) => {
  const router = useRouter()
  const { profile } = useProfile()
  const tabs = useTabsStateSnapshot()
  const tabId = createTabId('notebook', { id: report.id })

  const { can: canUpdateNotebook } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'user_content',
    {
      resource: {
        type: 'report',
        visibility: report.visibility,
        owner_id: report.owner_id,
      },
      subject: { id: profile?.id },
    }
  )

  const notebookButton = (
    <button
      type="button"
      onClick={() => {
        router.push(`/project/${projectRef}/sql/notebooks/${report.id}`)
      }}
      onDoubleClick={(event) => {
        event.preventDefault()
        tabs.makeTabPermanent(tabId)
      }}
      className={cn(
        'flex items-center gap-x-2 px-2 py-1.5 rounded-md text-sm transition truncate w-full text-left',
        isActive || (isOpened && !isPreview)
          ? 'bg-surface-200 text-foreground'
          : 'text-foreground-light hover:bg-surface-100 hover:text-foreground',
        isPreview && 'italic font-light'
      )}
    >
      <FileBarChart size={14} className="shrink-0" />
      <span className="truncate">{report.name}</span>
    </button>
  )

  if (!canUpdateNotebook) {
    return notebookButton
  }

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>{notebookButton}</ContextMenuTrigger>
      <ContextMenuContent onCloseAutoFocus={(e) => e.stopPropagation()}>
        <ContextMenuItem
          className="gap-x-2"
          onSelect={() => onSelectDelete()}
          onFocusCapture={(e) => e.stopPropagation()}
        >
          <Trash size={14} />
          Delete notebook
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
