import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  Copy,
  Download,
  Edit,
  ExternalLink,
  Heart,
  Lock,
  Move,
  Plus,
  Share,
  Trash,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ComponentProps, useEffect } from 'react'

import { keepPreviousData } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'
import { useParams } from 'common/hooks/useParams'
import { createSqlSnippetSkeletonV2 } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { getContentById } from 'data/content/content-id-query'
import { useSQLSnippetFolderContentsQuery } from 'data/content/sql-folder-contents-query'
import { Snippet } from 'data/content/sql-folders-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import useLatest from 'hooks/misc/useLatest'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
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
  cn,
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
  onEditSave,
  onMultiSelect,
  isLastItem,
  hasNextPage: _hasNextPage,
  fetchNextPage: _fetchNextPage,
  isFetchingNextPage: _isFetchingNextPage,
  sort,
  name,
  onFolderContentsChange,
  ...props
}: SQLEditorTreeViewItemProps) => {
  const router = useRouter()
  const { id, ref: projectRef } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const { className, onClick } = getNodeProps()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const isOwner = profile?.id === element?.metadata.owner_id
  const isSharedSnippet = element.metadata.visibility === 'project'
  const isFavorite = element.metadata.favorite

  const isEditing = status === 'editing'
  const isSaving = status === 'saving'

  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const parentId = element.parent === 0 ? undefined : element.parent

  const isEnabled = isBranch && isExpanded

  const {
    data,
    isSuccess,
    isLoading,
    isFetchingNextPage: isFetchingNextPageInFolder,
    hasNextPage: hasNextPageInFolder,
    fetchNextPage: fetchNestPageInFolder,
    isPlaceholderData,
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
      placeholderData: keepPreviousData,
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
        isLoading: isLoading || (isPlaceholderData && isFetching),
        snippets: data?.pages.flatMap((page) => page.contents ?? []),
      })
    }
  }, [data?.pages, isFetching, isLoading, isPlaceholderData, isEnabled])

  const isInFolder = parentId !== undefined

  const hasNextPage = isInFolder ? hasNextPageInFolder : _hasNextPage

  function fetchNextPage() {
    if (isInFolder) {
      fetchNestPageInFolder()
    } else if (typeof _fetchNextPage === 'function') {
      _fetchNextPage()
    }
  }

  const onToggleFavorite = () => {
    const snippetId = element.metadata.id
    if (snippetId) {
      if (isFavorite) snapV2.removeFavorite(snippetId)
      else snapV2.addFavorite(snippetId)
    }
  }

  const onSelectDuplicate = async () => {
    if (!profile) return console.error('Profile is required')
    if (!project) return console.error('Project is required')
    if (!projectRef) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')

    const snippet = element.metadata
    let sql: string = ''

    if (snippet.content && snippet.content.sql) {
      sql = snippet.content.sql
    } else {
      // Fetch the content first
      const { content } = await getContentById({ projectRef, id: snippet.id })
      if ('sql' in content) {
        sql = content.sql
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
            isPreview={props.isPreview}
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
            {...props}
            name={element.name}
            nameForTitle={props.nameForTitle}
            description={element.metadata?.description || undefined}
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
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Link
                  target="_self"
                  rel="noreferrer"
                  href={`/project/${projectRef}/sql/${element.id}`}
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
              {onSelectShare !== undefined &&
                !isSharedSnippet &&
                canCreateSQLSnippet &&
                IS_PLATFORM && (
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
              {IS_PLATFORM && (
                <ContextMenuItem_Shadcn_
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
