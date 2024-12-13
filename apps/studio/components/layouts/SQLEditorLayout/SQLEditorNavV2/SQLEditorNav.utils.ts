import { InfiniteData, InfiniteQueryObserver, useQueryClient } from '@tanstack/react-query'
import { SQLSnippetFolderContentsData } from 'data/content/sql-folder-contents-query'
import {
  Snippet,
  SnippetFolderResponse,
  SQLSnippetFoldersData,
} from 'data/content/sql-folders-query'
import { useEffect, useMemo, useState } from 'react'

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

/**
 * Returns a list of filtered snippets WITH filtered sub-snippets
 */
export function useFilteredSnippets(
  projectRef: string | undefined,
  snippetsPages?: InfiniteData<SQLSnippetFoldersData>,
  name?: string,
  sort?: 'name' | 'inserted_at'
) {
  const [results, setResults] = useState<
    {
      snippets: Snippet[]
      isLoading: boolean
    }[]
  >([])

  const queryClient = useQueryClient()
  useEffect(() => {
    const folderIds =
      snippetsPages?.pages.flatMap((page) => page.folders?.map((x) => x.id) ?? []) ?? []

    const unsubscribeFns = folderIds.map((folderId, i) =>
      new InfiniteQueryObserver<SQLSnippetFolderContentsData>(queryClient, {
        queryKey: ['projects', projectRef, 'content', 'folders', folderId, { name, sort }],
        keepPreviousData: true,
        enabled: false,
      }).subscribe(({ data, isLoading }) => {
        setResults((prev) => {
          const newResults = [...prev]
          newResults[i] = {
            snippets: data?.pages.flatMap((page) => page.contents ?? []) ?? [],
            isLoading,
          }
          return newResults
        })
      })
    )

    return () => {
      unsubscribeFns.forEach((unsub) => unsub())
    }
  }, [projectRef, queryClient, name, sort, snippetsPages?.pages])

  // rollup all result objects into one object
  return useMemo(
    () =>
      results.reduce(
        (acc, curr) => {
          return {
            snippets: [...acc.snippets, ...curr.snippets],
            isLoading: acc.isLoading || curr.isLoading,
          }
        },
        {
          snippets: snippetsPages?.pages.flatMap((page) => page.contents ?? []) ?? [],
          isLoading: false,
        }
      ),
    [results, snippetsPages?.pages]
  )
}
