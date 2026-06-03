import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { Loader2, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DeleteSnippetsModal } from './DeleteSnippetsModal'
import { ShareSnippetModal } from './ShareSnippetModal'
import { SnippetNavList } from './SnippetNavList'
import { SQL_EDITOR_NAV_LIST_GAP_CLASSNAME } from './SQLEditorNav.constants'
import { SqlEditorNavItem } from './SqlEditorNavItem'
import { UnshareSnippetModal } from './UnshareSnippetModal'
import { DownloadSnippetModal } from '@/components/interfaces/SQLEditor/DownloadSnippetModal'
import { RenameQueryModal } from '@/components/interfaces/SQLEditor/RenameQueryModal'
import { useContentCountQuery } from '@/data/content/content-count-query'
import { useContentInfiniteQuery } from '@/data/content/content-infinite-query'
import { Snippet, SNIPPET_PAGE_LIMIT } from '@/data/content/sql-folders-query'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

interface SearchListProps {
  search: string
}

export const SearchList = ({ search }: SearchListProps) => {
  const router = useRouter()
  const { id, chatId, ref: projectRef } = useParams()
  const tabs = useTabsStateSnapshot()
  const assistant = useAiAssistantStateSnapshot()

  const [selectedSnippetToShare, setSelectedSnippetToShare] = useState<Snippet>()
  const [selectedSnippetToUnshare, setSelectedSnippetToUnshare] = useState<Snippet>()
  const [selectedSnippetToDownload, setSelectedSnippetToDownload] = useState<Snippet>()
  const [selectedSnippetToRename, setSelectedSnippetToRename] = useState<Snippet>()
  const [selectedSnippetToDelete, setSelectedSnippetToDelete] = useState<Snippet>()

  const {
    data,
    isPending: isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useContentInfiniteQuery(
    {
      projectRef,
      type: 'sql',
      limit: SNIPPET_PAGE_LIMIT,
      name: search.length === 0 ? undefined : search,
    },
    { placeholderData: keepPreviousData }
  )

  const { data: count, isPending: isLoadingCount } = useContentCountQuery(
    {
      projectRef,
      type: 'sql',
      name: search,
    },
    { placeholderData: keepPreviousData }
  )
  const totalNumber = count ? count.private + count.shared : 0

  const chatResults = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    if (!assistant.isInitialized || searchTerm.length === 0) return []

    return Object.values(assistant.chats)
      .filter((chat) => chat.name.toLowerCase().includes(searchTerm))
      .sort((a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf())
  }, [assistant.chats, assistant.isInitialized, search])

  const totalResults = totalNumber + chatResults.length

  const snippets = useMemo(
    () => data?.pages.flatMap((page) => page.content.map((x) => ({ ...x, folder_id: null }))) ?? [],
    [data?.pages]
  ) as Snippet[]

  const activeSnippetId = id as string | undefined
  const isSnippetPreview = (snippetId: string) =>
    tabs.previewTabId === createTabId('sql', { id: snippetId })

  return (
    <>
      <div className="flex flex-col grow">
        {isLoadingCount ? (
          <div className="px-4 py-1 pb-2.5">
            <Loader2 className="animate-spin" size={14} />
          </div>
        ) : !!count || chatResults.length > 0 ? (
          <p className="px-4 pb-2 text-sm text-foreground-lighter">
            {totalResults} result{totalResults > 1 ? 's' : ''} found
          </p>
        ) : null}
        {chatResults.length > 0 && (
          <div className="px-2 pb-2">
            <p className="px-2 pb-1 text-xs text-foreground-lighter">Chats</p>
            <div className={cn('flex flex-col', SQL_EDITOR_NAV_LIST_GAP_CLASSNAME)}>
              {chatResults.map((chat) => {
                const tabId = createTabId('chat', { id: chat.id })
                const isPreview = tabs.previewTabId === tabId
                const isActive = !isPreview && chatId === chat.id

                return (
                  <SqlEditorNavItem
                    key={chat.id}
                    icon={<MessageCircle size={14} className="shrink-0" />}
                    label={chat.name}
                    isActive={isActive}
                    isPreview={isPreview}
                    onClick={() => router.push(`/project/${projectRef}/sql/chats/${chat.id}`)}
                    onDoubleClick={(event) => {
                      event.preventDefault()
                      tabs.makeTabPermanent(tabId)
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="px-4 flex flex-col gap-y-1">
            <ShimmeringLoader className="py-2.5" />
            <ShimmeringLoader className="py-2.5 w-5/6" />
            <ShimmeringLoader className="py-2.5 w-3/4" />
          </div>
        ) : (
          <div className={cn('flex flex-col px-2', SQL_EDITOR_NAV_LIST_GAP_CLASSNAME)}>
            <SnippetNavList
              snippets={snippets}
              activeSnippetId={activeSnippetId}
              isPreviewTabId={isSnippetPreview}
              getLabel={(snippet) => {
                const visibility =
                  snippet.visibility === 'user'
                    ? 'Private'
                    : snippet.visibility === 'project'
                      ? 'Shared'
                      : undefined

                return (
                  <span className="flex min-w-0 flex-col py-0.5">
                    <span className="truncate">{snippet.name}</span>
                    {!!visibility && (
                      <span className="text-foreground-lighter text-xs">{visibility}</span>
                    )}
                  </span>
                )
              }}
              getTitle={(snippet) => snippet.name}
              getItemClassName={() => 'items-start min-h-8 h-auto py-0.5 [&>span]:items-start'}
              onSnippetDelete={setSelectedSnippetToDelete}
              onSnippetRename={setSelectedSnippetToRename}
              onSnippetDownload={setSelectedSnippetToDownload}
              onSnippetShare={setSelectedSnippetToShare}
              onSnippetUnshare={setSelectedSnippetToUnshare}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </div>
        )}
      </div>

      <ShareSnippetModal
        snippet={selectedSnippetToShare}
        onClose={() => setSelectedSnippetToShare(undefined)}
      />

      <UnshareSnippetModal
        snippet={selectedSnippetToUnshare}
        onClose={() => setSelectedSnippetToUnshare(undefined)}
      />

      <DownloadSnippetModal
        id={selectedSnippetToDownload?.id ?? ''}
        open={selectedSnippetToDownload !== undefined}
        onOpenChange={() => setSelectedSnippetToDownload(undefined)}
      />

      <RenameQueryModal
        snippet={selectedSnippetToRename}
        visible={!!selectedSnippetToRename}
        onCancel={() => setSelectedSnippetToRename(undefined)}
        onComplete={() => setSelectedSnippetToRename(undefined)}
      />

      <DeleteSnippetsModal
        visible={!!selectedSnippetToDelete}
        snippets={!!selectedSnippetToDelete ? [selectedSnippetToDelete] : []}
        onClose={() => setSelectedSnippetToDelete(undefined)}
      />
    </>
  )
}
