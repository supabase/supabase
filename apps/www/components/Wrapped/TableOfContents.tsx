import { cn } from 'ui'
import { useWrapped } from './WrappedContext'

const BLACKLIST = ['home', 'intro']

export const TableOfContents = () => {
  const { currentPage, setCurrentPage } = useWrapped()

  const CONTENT_TABS = [
    {
      label: 'Year of AI',
      value: 'year-of-ai' as const,
    },
    {
      label: 'Dev <3 Supabase',
      value: 'devs' as const,
    },
  ]

  if (BLACKLIST.includes(currentPage)) return null

  return (
    <div className="border rounded-md p-3 fixed top-24 left-16 w-64">
      <div className="flex flex-col items-start gap-2">
        {CONTENT_TABS.map((tab) => (
          <button
            onClick={() => setCurrentPage(tab.value)}
            key={tab.value}
            className="uppercase text-xs font-mono tracking-widest text-foreground-lighter inline-flex gap-2 items-center font-medium w-full"
          >
            <span
              className={cn(
                'size-1.5 rounded-full bg-foreground-muted block',
                currentPage === tab.value && 'bg-brand'
              )}
            />

            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
