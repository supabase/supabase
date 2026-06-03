import { PermissionAction } from '@supabase/shared-types/out/constants'
import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common/hooks/useParams'
import { FolderClosed, Loader2, Plus, Trash } from 'lucide-react'
import { FocusEvent, useEffect, useRef, useState } from 'react'
import {
  cn,
  Collapsible,
  CollapsibleContent,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Input,
} from 'ui'

import { SnippetNavList } from './SnippetNavList'
import { SnippetNavLoadMore } from './SnippetNavLoadMore'
import {
  SQL_EDITOR_NAV_FOLDER_ICON_CLASSNAME,
  SQL_EDITOR_NAV_ITEM_HEIGHT_CLASSNAME,
  SQL_EDITOR_NAV_ITEM_TEXT_CLASSNAME,
  SQL_EDITOR_NAV_LIST_GAP_CLASSNAME,
} from './SQLEditorNav.constants'
import {
  getSqlEditorNavFolderTriggerClassName,
  getSqlEditorNavItemPaddingClass,
  SqlEditorNavFolderTrigger,
} from './SqlEditorNavItem'
import { useSQLSnippetFolderContentsQuery } from '@/data/content/sql-folder-contents-query'
import { Snippet, SnippetFolder } from '@/data/content/sql-folders-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import useLatest from '@/hooks/misc/useLatest'
import { useProfile } from '@/lib/profile'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'

interface SnippetNavFolderProps {
  folder: SnippetFolder
  snippets: Snippet[]
  depth?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  status?: 'editing' | 'saving' | 'idle'
  onEditSave?: (name: string) => void
  onSelectCreate?: () => void
  onSelectRename?: () => void
  onSelectDelete?: () => void
  sort?: 'inserted_at' | 'name'
  onFolderContentsChange?: (info: { isLoading: boolean; snippets?: Snippet[] }) => void
  selectedSnippets?: Snippet[]
  isMultiSelected?: boolean
  onMultiSelect?: (id: string) => void
  activeSnippetId?: string
  isPreviewTabId?: (snippetId: string) => boolean
  onSnippetDelete?: (snippet: Snippet) => void
  onSnippetRename?: (snippet: Snippet) => void
  onSnippetMove?: (snippet: Snippet) => void
  onSnippetShare?: (snippet: Snippet) => void
  onSnippetUnshare?: (snippet: Snippet) => void
  onSnippetDownload?: (snippet: Snippet) => void
}

export function SnippetNavFolder({
  folder,
  snippets,
  depth = 1,
  open,
  onOpenChange,
  status = 'idle',
  onEditSave,
  onSelectCreate,
  onSelectRename,
  onSelectDelete,
  sort,
  onFolderContentsChange,
  selectedSnippets = [],
  isMultiSelected = false,
  onMultiSelect,
  activeSnippetId,
  isPreviewTabId,
  onSnippetDelete,
  onSnippetRename,
  onSnippetMove,
  onSnippetShare,
  onSnippetUnshare,
  onSnippetDownload,
}: SnippetNavFolderProps) {
  const { ref: projectRef } = useParams()
  const { profile } = useProfile()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const isEditing = status === 'editing'
  const isSaving = status === 'saving'
  const isOwner = profile?.id === folder.owner_id

  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const {
    data,
    isSuccess,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isPlaceholderData,
    isFetching,
  } = useSQLSnippetFolderContentsQuery(
    { projectRef, folderId: folder.id, sort },
    { enabled: open, placeholderData: keepPreviousData }
  )

  useEffect(() => {
    if (projectRef && isSuccess) {
      data?.pages.forEach((page) => {
        page.contents?.forEach((snippet) => {
          snapV2.addSnippet({ projectRef, snippet })
        })
      })
    }
  }, [data?.pages, isSuccess, projectRef, snapV2])

  const onFolderContentsChangeRef = useLatest(onFolderContentsChange)
  useEffect(() => {
    if (open) {
      onFolderContentsChangeRef.current?.({
        isLoading: isLoading || (isPlaceholderData && isFetching),
        snippets: data?.pages.flatMap((page) => page.contents ?? []),
      })
    }
  }, [data?.pages, isFetching, isLoading, isPlaceholderData, open])

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="w-full">
      <ContextMenu modal={false}>
        <ContextMenuTrigger asChild>
          {isEditing ? (
            <SnippetNavFolderEditingRow
              folder={folder}
              depth={depth}
              isSaving={isSaving}
              onEditSave={onEditSave}
            />
          ) : (
            <SqlEditorNavFolderTrigger
              depth={depth}
              open={open}
              label={folder.name}
              isLoading={isLoading || isSaving}
              className="w-full"
            />
          )}
        </ContextMenuTrigger>
        <ContextMenuContent onCloseAutoFocus={(e) => e.stopPropagation()}>
          {onSelectCreate !== undefined && (
            <ContextMenuItem
              className="gap-x-2"
              onSelect={() => onSelectCreate()}
              onFocusCapture={(e) => e.stopPropagation()}
              disabled={!canCreateSQLSnippet}
            >
              <Plus size={14} />
              Create new snippet
            </ContextMenuItem>
          )}
          {onSelectRename !== undefined && isOwner && (
            <ContextMenuItem
              className="gap-x-2"
              onSelect={() => onSelectRename()}
              onFocusCapture={(e) => e.stopPropagation()}
            >
              Rename folder
            </ContextMenuItem>
          )}
          {onSelectDelete !== undefined && isOwner && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                className="gap-x-2"
                onSelect={() => onSelectDelete()}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Trash size={14} />
                Delete folder
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      {open ? (
        <CollapsibleContent className={cn('flex flex-col', SQL_EDITOR_NAV_LIST_GAP_CLASSNAME)}>
          <SnippetNavList
            snippets={snippets}
            depth={depth + 1}
            selectedSnippets={selectedSnippets}
            isMultiSelected={isMultiSelected}
            onMultiSelect={onMultiSelect}
            activeSnippetId={activeSnippetId}
            isPreviewTabId={isPreviewTabId}
            onSnippetDelete={onSnippetDelete}
            onSnippetRename={onSnippetRename}
            onSnippetMove={onSnippetMove}
            onSnippetShare={onSnippetShare}
            onSnippetUnshare={onSnippetUnshare}
            onSnippetDownload={onSnippetDownload}
          />
          <SnippetNavLoadMore
            depth={depth + 1}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  )
}

function SnippetNavFolderEditingRow({
  folder,
  depth,
  isSaving,
  onEditSave,
}: {
  folder: SnippetFolder
  depth: number
  isSaving?: boolean
  onEditSave?: (name: string) => void
}) {
  const [localName, setLocalName] = useState(folder.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const editStartedAtRef = useRef(0)

  useEffect(() => {
    editStartedAtRef.current = Number(new Date())
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const timeDiff = Number(new Date()) - editStartedAtRef.current
    if (timeDiff < 400) {
      event.preventDefault()
      inputRef.current?.focus()
      return
    }
    onEditSave?.(localName)
  }

  return (
    <div className={getSqlEditorNavFolderTriggerClassName(depth, 'w-full')}>
      {isSaving ? (
        <Loader2
          className={cn(SQL_EDITOR_NAV_FOLDER_ICON_CLASSNAME, 'animate-spin')}
          size={14}
          strokeWidth={1.5}
        />
      ) : (
        <FolderClosed
          size={14}
          strokeWidth={1.5}
          className={SQL_EDITOR_NAV_FOLDER_ICON_CLASSNAME}
        />
      )}
      <Input
        autoFocus
        ref={inputRef}
        size="tiny"
        className={cn(
          'flex-1',
          SQL_EDITOR_NAV_ITEM_HEIGHT_CLASSNAME,
          SQL_EDITOR_NAV_ITEM_TEXT_CLASSNAME
        )}
        value={localName}
        onChange={(event) => setLocalName(event.target.value)}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            inputRef.current?.blur()
          } else if (event.key === 'Escape') {
            setLocalName(folder.name)
            onEditSave?.(folder.name)
          }
        }}
      />
    </div>
  )
}
