import { useParams } from 'common/hooks/useParams'
import { cn } from 'ui'

import { SnippetNavFolder } from './SnippetNavFolder'
import { SnippetNavList } from './SnippetNavList'
import { SnippetNavLoadMore } from './SnippetNavLoadMore'
import { SQL_EDITOR_NAV_LIST_GAP_CLASSNAME } from './SQLEditorNav.constants'
import { Snippet, SnippetFolder } from '@/data/content/sql-folders-query'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { createTabId } from '@/state/tabs'

interface PrivateSnippetsNavProps {
  folders: SnippetFolder[]
  snippets: Snippet[]
  sort: 'inserted_at' | 'name'
  expandedFolderIds: string[]
  onExpandedFolderIdsChange: (ids: string[]) => void
  selectedSnippets: Snippet[]
  activeSnippetId?: string
  previewTabId?: string
  onMultiSelect: (id: string) => void
  onSelectCreateInFolder: (folderId: string) => void
  onSelectDeleteFolder: (folder: SnippetFolder) => void
  onSelectRenameFolder: (folderId: string) => void
  onEditSaveFolder: (folderId: string, name: string) => void
  onFolderContentsChange: (
    folderId: string,
    info: { isLoading: boolean; snippets?: Snippet[] }
  ) => void
  onSnippetDelete: (snippet: Snippet) => void
  onSnippetRename: (snippet: Snippet) => void
  onSnippetMove: (snippet: Snippet) => void
  onSnippetShare: (snippet: Snippet) => void
  onSnippetDownload: (snippet: Snippet) => void
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
}

export function PrivateSnippetsNav({
  folders,
  snippets,
  sort,
  expandedFolderIds,
  onExpandedFolderIdsChange,
  selectedSnippets,
  activeSnippetId,
  previewTabId,
  onMultiSelect,
  onSelectCreateInFolder,
  onSelectDeleteFolder,
  onSelectRenameFolder,
  onEditSaveFolder,
  onFolderContentsChange,
  onSnippetDelete,
  onSnippetRename,
  onSnippetMove,
  onSnippetShare,
  onSnippetDownload,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: PrivateSnippetsNavProps) {
  const { ref: projectRef } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const rootSnippets = snippets.filter((snippet) => !snippet.folder_id)

  const isPreviewTabId = (snippetId: string) =>
    previewTabId === createTabId('sql', { id: snippetId })

  const setFolderExpanded = (folderId: string, open: boolean) => {
    if (open && !expandedFolderIds.includes(folderId)) {
      onExpandedFolderIdsChange([...expandedFolderIds, folderId])
    }
    if (!open && expandedFolderIds.includes(folderId)) {
      onExpandedFolderIdsChange(expandedFolderIds.filter((id) => id !== folderId))
    }
  }

  if (!projectRef) return null

  return (
    <div className={cn('flex flex-col', SQL_EDITOR_NAV_LIST_GAP_CLASSNAME)}>
      {folders.map((folder) => {
        const folderSnippets = snippets.filter((snippet) => snippet.folder_id === folder.id)
        const folderState = snapV2.folders[folder.id]

        return (
          <SnippetNavFolder
            key={folder.id}
            folder={folder}
            snippets={folderSnippets}
            depth={1}
            open={expandedFolderIds.includes(folder.id)}
            onOpenChange={(open) => setFolderExpanded(folder.id, open)}
            status={folderState?.status ?? 'idle'}
            sort={sort}
            selectedSnippets={selectedSnippets}
            isMultiSelected={selectedSnippets.length > 1}
            onMultiSelect={onMultiSelect}
            activeSnippetId={activeSnippetId}
            isPreviewTabId={isPreviewTabId}
            onFolderContentsChange={(info) => onFolderContentsChange(folder.id, info)}
            onEditSave={(name) => onEditSaveFolder(folder.id, name)}
            onSelectCreate={() => onSelectCreateInFolder(folder.id)}
            onSelectRename={() => onSelectRenameFolder(folder.id)}
            onSelectDelete={() => onSelectDeleteFolder(folder)}
            onSnippetDelete={onSnippetDelete}
            onSnippetRename={onSnippetRename}
            onSnippetMove={onSnippetMove}
            onSnippetShare={onSnippetShare}
            onSnippetDownload={onSnippetDownload}
          />
        )
      })}
      <SnippetNavList
        snippets={rootSnippets}
        depth={1}
        selectedSnippets={selectedSnippets}
        isMultiSelected={selectedSnippets.length > 1}
        onMultiSelect={onMultiSelect}
        activeSnippetId={activeSnippetId}
        isPreviewTabId={isPreviewTabId}
        onSnippetDelete={onSnippetDelete}
        onSnippetRename={onSnippetRename}
        onSnippetMove={onSnippetMove}
        onSnippetShare={onSnippetShare}
        onSnippetDownload={onSnippetDownload}
      />
      <SnippetNavLoadMore
        depth={1}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  )
}
