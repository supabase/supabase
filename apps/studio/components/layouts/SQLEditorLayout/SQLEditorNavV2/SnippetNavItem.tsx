import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'common'
import { useParams } from 'common/hooks/useParams'
import {
  Copy,
  Database,
  Download,
  Edit,
  ExternalLink,
  Heart,
  Lock,
  Move,
  ScrollText,
  Share,
  Trash,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'
import {
  cn,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from 'ui'

import { SqlEditorNavItem } from './SqlEditorNavItem'
import { createSqlSnippetSkeletonV2 } from '@/components/interfaces/SQLEditor/SQLEditor.utils'
import { isLogsSnippet } from '@/components/interfaces/SQLEditor/sqlSnippet.utils'
import { getContentById } from '@/data/content/content-id-query'
import { Snippet } from '@/data/content/sql-folders-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProfile } from '@/lib/profile'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export interface SnippetNavItemCallbacks {
  onSelectDelete?: () => void
  onSelectRename?: () => void
  onSelectMove?: () => void
  onSelectShare?: () => void
  onSelectUnshare?: () => void
  onSelectDownload?: () => void
}

export interface SnippetNavItemProps extends SnippetNavItemCallbacks {
  snippet: Snippet
  depth?: number
  isActive?: boolean
  isHighlighted?: boolean
  isPreview?: boolean
  isMultiSelected?: boolean
  onMultiSelect?: (id: string) => void
  label?: ReactNode
  title?: string
  className?: string
}

export function SnippetNavItem({
  snippet,
  depth = 1,
  isActive = false,
  isHighlighted = false,
  isPreview = false,
  isMultiSelected = false,
  onMultiSelect,
  onSelectDelete,
  onSelectRename,
  onSelectMove,
  onSelectShare,
  onSelectUnshare,
  onSelectDownload,
  label,
  title,
  className,
}: SnippetNavItemProps) {
  const router = useRouter()
  const { id, ref: projectRef } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabs = useTabsStateSnapshot()

  const isOwner = profile?.id === snippet.owner_id
  const isSharedSnippet = snippet.visibility === 'project'
  const isFavorite = snippet.favorite
  const snippetFromStore = snapV2.snippets[snippet.id]?.snippet
  const isLogsQuery = isLogsSnippet(snippetFromStore ?? snippet)
  const tabId = createTabId('sql', { id: snippet.id })

  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const onToggleFavorite = () => {
    if (isFavorite) snapV2.removeFavorite(snippet.id)
    else snapV2.addFavorite(snippet.id)
  }

  const onSelectDuplicate = async () => {
    if (!profile) return console.error('Profile is required')
    if (!project) return console.error('Project is required')
    if (!projectRef) return console.error('Project ref is required')

    const snippetForDuplicate = snippetFromStore ?? snippet
    let sql = ''

    if (
      snippetForDuplicate &&
      'content' in snippetForDuplicate &&
      snippetForDuplicate.content &&
      'unchecked_sql' in snippetForDuplicate.content
    ) {
      sql = snippetForDuplicate.content.unchecked_sql
    } else {
      const { content } = await getContentById({ projectRef, id: snippet.id })
      if ('unchecked_sql' in content) {
        sql = content.unchecked_sql
      }
    }

    const snippetCopy = createSqlSnippetSkeletonV2({
      name: `${snippet.name} (Duplicate)`,
      sql,
      owner_id: profile?.id,
      project_id: project?.id,
    })

    snapV2.addSnippet({ projectRef, snippet: snippetCopy })
    snapV2.addNeedsSaving(snippetCopy.id!)
    router.push(`/project/${projectRef}/sql/${snippetCopy.id}`)
  }

  const itemButton = (
    <SqlEditorNavItem
      depth={depth}
      isActive={isActive}
      isHighlighted={isHighlighted}
      isPreview={isPreview}
      title={title ?? snippet.name}
      className={className}
      icon={
        isLogsQuery ? (
          <ScrollText size={14} strokeWidth={1.5} className="shrink-0" />
        ) : (
          <Database size={14} strokeWidth={1.5} className="shrink-0" />
        )
      }
      label={label ?? snippet.name}
      onClick={(event) => {
        if (!event.shiftKey) {
          router.push(`/project/${projectRef}/sql/${snippet.id}`)
        } else if (id !== 'new') {
          onMultiSelect?.(snippet.id)
        } else {
          router.push(`/project/${projectRef}/sql/${snippet.id}`)
        }
      }}
      onDoubleClick={(event) => {
        event.preventDefault()
        tabs.makeTabPermanent(tabId)
      }}
    />
  )

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>{itemButton}</ContextMenuTrigger>
      <ContextMenuContent onCloseAutoFocus={(e) => e.stopPropagation()}>
        {isMultiSelected ? (
          <>
            {onSelectMove !== undefined && (
              <ContextMenuItem
                className="gap-x-2"
                onSelect={() => onSelectMove()}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Move size={14} />
                Move selected queries
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            {onSelectDelete !== undefined && (
              <ContextMenuItem
                className="gap-x-2"
                onSelect={() => onSelectDelete()}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Trash size={14} />
                Delete selected queries
              </ContextMenuItem>
            )}
          </>
        ) : (
          <>
            <ContextMenuItem
              asChild
              className="gap-x-2"
              onFocusCapture={(e) => e.stopPropagation()}
            >
              <Link
                target="_self"
                rel="noreferrer"
                href={`/project/${projectRef}/sql/${snippet.id}`}
              >
                <ExternalLink size={14} />
                Open in new tab
              </Link>
            </ContextMenuItem>
            <ContextMenuSeparator />
            {onSelectRename !== undefined && isOwner && (
              <ContextMenuItem
                className="gap-x-2"
                onSelect={() => onSelectRename()}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Edit size={14} />
                Rename query
              </ContextMenuItem>
            )}
            {onSelectMove !== undefined && isOwner && (
              <ContextMenuItem
                className="gap-x-2"
                onSelect={() => onSelectMove()}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Move size={14} />
                Move query
              </ContextMenuItem>
            )}
            {onSelectShare !== undefined &&
              !isSharedSnippet &&
              canCreateSQLSnippet &&
              IS_PLATFORM && (
                <ContextMenuItem
                  className="gap-x-2"
                  onSelect={() => onSelectShare()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Share size={14} />
                  Share query with team
                </ContextMenuItem>
              )}
            {onSelectUnshare !== undefined && isSharedSnippet && isOwner && (
              <ContextMenuItem
                className="gap-x-2"
                onSelect={() => onSelectUnshare()}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Lock size={14} />
                Unshare query with team
              </ContextMenuItem>
            )}
            {canCreateSQLSnippet && (
              <ContextMenuItem
                className="gap-x-2"
                onSelect={() => onSelectDuplicate()}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Copy size={14} />
                Duplicate query
              </ContextMenuItem>
            )}
            {IS_PLATFORM && (
              <ContextMenuItem
                className="gap-x-2"
                onSelect={() => onToggleFavorite()}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Heart
                  size={14}
                  className={cn(
                    isFavorite ? 'fill-brand stroke-none' : 'fill-none stroke-foreground-light'
                  )}
                />
                {isFavorite ? 'Remove from' : 'Add to'} favorites
              </ContextMenuItem>
            )}
            {onSelectDownload !== undefined && IS_PLATFORM && (
              <ContextMenuItem
                className="gap-x-2"
                onSelect={() => onSelectDownload()}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Download size={14} />
                Export query
              </ContextMenuItem>
            )}
            {onSelectDelete !== undefined && isOwner && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem className="gap-x-2" onSelect={() => onSelectDelete()}>
                  <Trash size={14} />
                  Delete query
                </ContextMenuItem>
              </>
            )}
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
