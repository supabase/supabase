import { useParams } from 'common'
import { NotebookText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ExplorerNavResourceWrapper, rowClassName } from './ExplorerLayout.constants'
import { useNotebooksInfiniteQuery } from '@/data/content/notebooks/notebooks-infinite-query'

export const ExplorerNavNotebooks = ({ onBack }: { onBack: () => void }) => {
  const router = useRouter()
  const { ref, id } = useParams()
  const [search, setSearch] = useState('')

  const { data: notebooksData, isPending } = useNotebooksInfiniteQuery({
    projectRef: ref,
    limit: 100,
  })
  const notebooks = useMemo(() => {
    const items = notebooksData?.pages.flatMap((page) => page.content) ?? []
    return items
  }, [notebooksData?.pages])

  return (
    <ExplorerNavResourceWrapper
      type="notebook"
      search={search}
      setSearch={setSearch}
      onBack={onBack}
    >
      <div className="flex flex-1 flex-col gap-px overflow-y-auto px-3 pb-3">
        {isPending ? (
          <GenericSkeletonLoader />
        ) : notebooks.length === 0 ? (
          <p className="px-2 py-2 text-xs text-foreground-lighter">
            {search ? 'No notebooks found' : 'No notebooks created yet'}
          </p>
        ) : (
          notebooks.map((notebook) => {
            const isActive = router.pathname.includes('/explorer/chat/') && id === notebook.id

            return (
              <Link
                key={notebook.id}
                href={`/project/${ref}/explorer/notebook/${notebook.id}`}
                className={rowClassName(isActive)}
              >
                <NotebookText size={14} className={cn('shrink-0', isActive && 'text-foreground')} />
                <span className="truncate text-left">{notebook.name}</span>
              </Link>
            )
          })
        )}
      </div>
    </ExplorerNavResourceWrapper>
  )
}
