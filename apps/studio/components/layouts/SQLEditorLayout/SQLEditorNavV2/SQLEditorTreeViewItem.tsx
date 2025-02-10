import { Copy, Download, Edit, ExternalLink, Lock, Move, Plus, Share, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ComponentProps, useEffect } from 'react'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'common'
import { useParams } from 'common/hooks/useParams'
import { useSQLSnippetFolderContentsQuery } from 'data/content/sql-folder-contents-query'
import { Snippet } from 'data/content/sql-folders-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import useLatest from 'hooks/misc/useLatest'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  Button,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  ContextMenu_Shadcn_,
  TreeViewItem,
} from 'ui'

interface SQLEditorTreeViewItemProps
  extends Omit<ComponentProps<typeof TreeViewItem>, 'name' | 'xPadding'> {
  element: any
  isMultiSelected?: boolean
  status?: 'editing' | 'saving' | 'idle'
  getNodeProps: () => any
  onSelectCreate?: () => void
  onSelectDelete?: () => void
  onSelectRename?: () => void
  onSelectMove?: () => void
  onSelectShare?: () => void
  onSelectUnshare?: () => void
  onSelectDownload?: () => void
  onSelectDuplicate?: () => void
  onSelectDeleteFolder?: () => void
  onEditSave?: (name: string) => void
  onMultiSelect?: (id: string) => void

  // Pagination/filtering options
  isLastItem: boolean
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
  sort?: 'inserted_at' | 'name'
  name?: string
  onFolderContentsChange?: (info: { isLoading: boolean; snippets?: Snippet[] }) => void
}

export const SQLEditorTreeViewItem = ({
  element,
  isBranch,
  isExpanded,
  level,
  status,
  isSelected,
  isMultiSelected,
  getNodeProps,
  onSelectCreate,
  onSelectDelete,
  onSelectRename,
  onSelectMove,
  onSelectShare,
  onSelectUnshare,
  onSelectDownload,
  onSelectDuplicate,
  onEditSave,
  onMultiSelect,
  isLastItem,
  hasNextPage: _hasNextPage,
  fetchNextPage: _fetchNextPage,
  isFetchingNextPage: _isFetchingNextPage,
  sort,
  name,
  onFolderContentsChange,
}: SQLEditorTreeViewItemProps) => {
  const router = useRouter()
  const { id, ref: projectRef } = useParams()
  const { profile } = useProfile()
  const { className, onClick } = getNodeProps()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const isOwner = profile?.id === element?.metadata.owner_id
  const isSharedSnippet = element.metadata.visibility === 'project'

  const isEditing = status === 'editing'
  const isSaving = status === 'saving'

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const parentId = element.parent === 0 ? undefined : element.parent

  const isEnabled = isBranch && isExpanded

  const {
    data,
    isSuccess,
    isLoading,
    isFetchingNextPage: isFetchingNextPageInFolder,
    hasNextPage: hasNextPageInFolder,
    fetchNextPage: fetchNestPageInFolder,
    isPreviousData,
    isFetching,
  } = useSQLSnippetFolderContentsQuery(
    {
      projectRef,
      folderId: parentId ?? element.id,
      name,
      sort,
    },
    {
      enabled: isEnabled,
      keepPreviousData: true,
    }
  )
  useEffect(() => {
    if (projectRef && isSuccess) {
      data.pages.forEach((page) => {
        page.contents?.forEach((snippet) => {
          snapV2.addSnippet({
            projectRef,
            snippet,
          })
        })
      })
    }
  }, [projectRef, data?.pages])

  const onFolderContentsChangeRef = useLatest(onFolderContentsChange)
  useEffect(() => {
    if (isEnabled) {
      onFolderContentsChangeRef.current?.({
        isLoading: isLoading || (isPreviousData && isFetching),
        snippets: data?.pages.flatMap((page) => page.contents ?? []),
      })
    }
  }, [data?.pages, isFetching, isLoading, isPreviousData, isEnabled])

  const isInFolder = parentId !== undefined

  const hasNextPage = isInFolder ? hasNextPageInFolder : _hasNextPage

  function fetchNextPage() {
    if (isInFolder) {
      fetchNestPageInFolder()
    } else if (typeof _fetchNextPage === 'function') {
      _fetchNextPage()
    }
  }

  return (
    <>
      <ContextMenu_Shadcn_ modal={false}>
        <ContextMenuTrigger_Shadcn_ asChild>
          <TreeViewItem
            className={className}
            level={level}
            isExpanded={isExpanded}
            isBranch={isBranch}
            isSelected={isSelected}
            isEditing={isEditing}
            isLoading={(isEnabled && isLoading) || isSaving}
            onEditSubmit={(value) => {
              if (onEditSave !== undefined) onEditSave(value)
            }}
            onClick={(e) => {
              if (!isBranch) {
                if (!e.shiftKey) {
                  router.push(`/project/${projectRef}/sql/${element.id}`)
                } else if (id !== 'new') {
                  onMultiSelect?.(element.id)
                } else {
                  router.push(`/project/${projectRef}/sql/${element.id}`)
                }
              } else {
                // Prevent expanding folder while editing text
                // as the user may double click to select etc
                if (isEditing) {
                  return
                }

                // When the item is a folder, we want to expand/close it
                onClick(e)
              }
            }}
            name={element.name}
            xPadding={16}
          />
        </ContextMenuTrigger_Shadcn_>
        <ContextMenuContent_Shadcn_ onCloseAutoFocus={(e) => e.stopPropagation()}>
          {isBranch ? (
            <>
              {onSelectCreate !== undefined && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectCreate()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Plus size={14} />
                  Create new snippet
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectRename !== undefined && isOwner && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectRename()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Edit size={14} />
                  Rename folder
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectDelete !== undefined && isOwner && (
                <>
                  <ContextMenuSeparator_Shadcn_ />
                  <ContextMenuItem_Shadcn_
                    className="gap-x-2"
                    onSelect={() => onSelectDelete()}
                    onFocusCapture={(e) => e.stopPropagation()}
                  >
                    <Trash size={14} />
                    Delete folder
                  </ContextMenuItem_Shadcn_>
                </>
              )}
            </>
          ) : isMultiSelected ? (
            <>
              {onSelectMove !== undefined && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectMove()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Move size={14} />
                  Move selected queries
                </ContextMenuItem_Shadcn_>
              )}
              <ContextMenuSeparator_Shadcn_ />
              {onSelectDelete !== undefined && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectDelete()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Trash size={14} />
                  Delete selected queries
                </ContextMenuItem_Shadcn_>
              )}
            </>
          ) : (
            <>
              <ContextMenuItem_Shadcn_
                asChild
                className="gap-x-2"
                onSelect={() => {}}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Link
                  href={`/project/${projectRef}/sql/${element.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={14} />
                  Open in new tab
                </Link>
              </ContextMenuItem_Shadcn_>
              <ContextMenuSeparator_Shadcn_ />
              {onSelectRename !== undefined && isOwner && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectRename()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Edit size={14} />
                  Rename query
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectMove !== undefined && isOwner && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectMove()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Move size={14} />
                  Move query
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectShare !== undefined && !isSharedSnippet && canCreateSQLSnippet && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectShare()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Share size={14} />
                  Share query with team
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectUnshare !== undefined && isSharedSnippet && isOwner && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectUnshare()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Lock size={14} />
                  Unshare query with team
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectDuplicate !== undefined && canCreateSQLSnippet && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectDuplicate()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Copy size={14} />
                  Duplicate query
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectDownload !== undefined && IS_PLATFORM && (
                <ContextMenuItem_Shadcn_
                  className="gap-x-2"
                  onSelect={() => onSelectDownload()}
                  onFocusCapture={(e) => e.stopPropagation()}
                >
                  <Download size={14} />
                  Download as migration file
                </ContextMenuItem_Shadcn_>
              )}
              {onSelectDelete !== undefined && isOwner && (
                <>
                  <ContextMenuSeparator_Shadcn_ />
                  <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={() => onSelectDelete()}>
                    <Trash size={14} />
                    Delete query
                  </ContextMenuItem_Shadcn_>
                </>
              )}
            </>
          )}
        </ContextMenuContent_Shadcn_>
      </ContextMenu_Shadcn_>

      {hasNextPage && typeof element.id === 'string' && isLastItem && (
        <div
          className="px-4 py-1"
          style={{
            paddingLeft:
              !element.isBranch && element.level > 1 ? 48 * (element.level - 1) : undefined,
          }}
        >
          <Button
            type="outline"
            size="tiny"
            block
            loading={isInFolder ? isFetchingNextPageInFolder : _isFetchingNextPage}
            disabled={isInFolder ? isFetchingNextPageInFolder : _isFetchingNextPage}
            onClick={fetchNextPage}
          >
            Load More
          </Button>
        </div>
      )}
    </>
  )
}
