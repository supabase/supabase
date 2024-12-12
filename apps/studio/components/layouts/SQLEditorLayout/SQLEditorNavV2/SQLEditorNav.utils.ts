import { getSQLSnippetFolders, SnippetFolderResponse } from 'data/content/sql-folders-query'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'

export interface TreeViewItemProps {
  id: string | number
  name: string
  parent: number | string | null
  children: any[]
  metadata?: any
}

export const ROOT_NODE: TreeViewItemProps = { id: 0, name: '', parent: null, children: [] }

// [Joshen] At the moment this is only tuned for single level folders
// Will need to relook at this for multi level folders,
export const formatFolderResponseForTreeView = (
  response?: SnippetFolderResponse
): TreeViewItemProps[] => {
  if (response === undefined) return [ROOT_NODE]

  const { folders, contents } = response

  const formattedFolders =
    folders?.map((folder) => {
      const { id, name } = folder
      return {
        id,
        name,
        parent: 0,
        isBranch: true,
        children:
          contents?.filter((content) => content.folder_id === id).map((content) => content.id) ??
          [],
        metadata: folder,
      }
    }) || []

  const formattedContents =
    contents?.map((content) => {
      const { id, name, folder_id } = content
      return { id, name, parent: folder_id ?? 0, children: [], metadata: content }
    }) || []

  const root = {
    id: 0,
    name: '',
    parent: null,
    children: [
      ...(folders || [])?.map((folder) => folder.id),
      ...(contents || []).filter((content) => !content.folder_id)?.map((content) => content.id),
    ],
  }

  return [root, ...formattedFolders, ...formattedContents]
}

export function getLastItemIds(items: TreeViewItemProps[]) {
  let lastItemIds = new Set<string>()

  const topLevelItems = items.filter((item) => item.parent === 0)

  if (topLevelItems.length > 0) {
    const lastItem = topLevelItems[topLevelItems.length - 1]
    if (typeof lastItem.id === 'string') {
      lastItemIds.add(lastItem.id)
    }

    topLevelItems.forEach((item) => {
      if (item.children.length > 0) {
        const childrenLastItem = item.children[item.children.length - 1]

        if (typeof childrenLastItem === 'string') {
          lastItemIds.add(childrenLastItem)
        }
      }
    })
  }

  return lastItemIds
}

export function useFetchSQLSnippetFolders() {
  const snapV2 = useSqlEditorV2StateSnapshot()

  const fetchSQLSnippetFolders = useCallback(
    ({ projectRef, folderId, cursor, sort, name }: Parameters<typeof getSQLSnippetFolders>[0]) => {
      if (projectRef === undefined) return Promise.resolve()

      return getSQLSnippetFolders({ projectRef, folderId, cursor, sort, name })
        .then((data) => {
          const key = ['private', sort, name].filter(Boolean).join(':')

          if (data.contents !== undefined) {
            snapV2.addSnippets({
              projectRef,
              snippets: data.contents,
              key,
            })
          }

          data.folders?.forEach((folder) => {
            snapV2.addFolder({ projectRef, folder })
          })

          snapV2.setCursor({ projectRef, parentId: folderId, cursor: data.cursor, filter: key })
        })
        .catch((error) => {
          toast.error('Failed to fetch snippets: ' + error.message)
        })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return fetchSQLSnippetFolders
}
