import { PermissionAction } from '@supabase/shared-types/out/constants'
import { FileBarChart, Trash } from 'lucide-react'
import { useRouter } from 'next/router'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from 'ui'

import { SqlEditorNavItem } from './SqlEditorNavItem'
import { Content } from '@/data/content/content-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useProfile } from '@/lib/profile'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

interface NotebookNavItemProps {
  report: Content
  projectRef: string
  isActive: boolean
  isPreview: boolean
  onSelectDelete: () => void
}

export const NotebookNavItem = ({
  report,
  projectRef,
  isActive,
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
    <SqlEditorNavItem
      icon={<FileBarChart size={14} className="shrink-0" />}
      label={report.name}
      isActive={isActive}
      isPreview={isPreview}
      onClick={() => {
        router.push(`/project/${projectRef}/sql/notebooks/${report.id}`)
      }}
      onDoubleClick={(event) => {
        event.preventDefault()
        tabs.makeTabPermanent(tabId)
      }}
    />
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
