import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { Save } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState, type PropsWithChildren } from 'react'
import { toast } from 'sonner'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ExplorerToolbarAction } from './ExplorerToolbar'
import { useCreateNotebook } from './hooks'
import { createLogCellSkeleton, createQueryCellSkeleton } from './utils'
import { getNotebook } from '@/data/content/notebooks/notebook-query'
import { useNotebooksInfiniteQuery } from '@/data/content/notebooks/notebooks-infinite-query'
import { type QuerySourceBinding } from '@/data/query-sources/query-source-registry'
import { useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'

interface SaveQueryDropdownProps {
  query: { title: string; sql: string }
  /** Saves as a log cell when the query targets logs. Defaults to a database cell. */
  source?: QuerySourceBinding
}

export const SaveQueryDropdown = ({
  children,
  query,
  source,
}: PropsWithChildren<SaveQueryDropdownProps>) => {
  const router = useRouter()
  const { ref } = useParams()
  const { createNotebook } = useCreateNotebook()
  const notebooksSnap = useNotebooksStateSnapshot()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const { data: notebooksData, isPending } = useNotebooksInfiniteQuery({
    projectRef: ref,
    limit: 100,
    name: search.length === 0 ? search : debouncedSearch,
  })
  const notebooks = useMemo(() => {
    const items = notebooksData?.pages.flatMap((page) => page.content) ?? []
    return items
  }, [notebooksData?.pages])

  const createCell = () =>
    source?._tag === 'logs'
      ? createLogCellSkeleton({ ...query, time_range: source.time_range })
      : createQueryCellSkeleton(query)

  const onAddToNewNotebook = () => {
    createNotebook({
      cells: [createCell()],
    })
  }

  const onAddToExistingNotebook = async (notebookId: string) => {
    if (!ref) return
    try {
      if (!notebooksSnap.notebooks[notebookId]?.notebook.content) {
        const notebook = await getNotebook({ projectRef: ref, id: notebookId })
        notebooksSnap.setNotebook({ projectRef: ref, notebook })
      }

      notebooksSnap.insertCellAfter({
        id: notebookId,
        cell: createCell(),
      })
      notebooksSnap.requestScrollToBottom(notebookId)

      router.push(`/project/${ref}/explorer/notebook/${notebookId}`)
    } catch (error) {
      toast.error('Failed to add query to notebook')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <ExplorerToolbarAction icon={<Save size={16} strokeWidth={2} />} tooltip="Save query" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Add to existing notebook</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-0">
            <Command shouldFilter={false}>
              <CommandInput
                autoFocus
                placeholder="Search notebooks..."
                className="text-xs"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandGroup>
                  {isPending ? (
                    <div className="flex flex-col p-1 gap-y-1">
                      <ShimmeringLoader />
                      <ShimmeringLoader className="w-3/4" />
                    </div>
                  ) : !notebooks?.length ? (
                    <p className="text-xs text-center text-foreground-lighter py-3">
                      No notebooks found
                    </p>
                  ) : null}
                  {notebooks?.map((notebook) => (
                    <CommandItem
                      key={notebook.id}
                      value={notebook.id}
                      className="cursor-pointer"
                      onSelect={() => onAddToExistingNotebook(notebook.id)}
                    >
                      {notebook.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={onAddToNewNotebook}>Create a new notebook</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
