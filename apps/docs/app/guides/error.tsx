'use client'

import { useDocsSearch } from 'common'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Button, cn } from 'ui'
import { useCommandMenu } from 'ui-patterns/Cmdk'
import ButtonCard from '~/components/ButtonCard'

const GuideErrorPage = () => {
  const pathname = usePathname() ?? ''
  const { setIsOpen: setCommandMenuOpen } = useCommandMenu()
  const { searchState, handleDocsSearch } = useDocsSearch()

  useEffect(() => {
    const query = decodeURIComponent(pathname.replace(/^\/(?:guides|reference)\//, '')).replace(
      /[_-]/g,
      ' '
    )
    if (!query) return
    handleDocsSearch(query)
  }, [handleDocsSearch, pathname])

  const hasRecommendations =
    searchState.status === 'partialResults' || searchState.status === 'fullResults'

  return (
    <article className="prose max-w-[80ch]">
      <h1>We couldn&apos;t find that page</h1>
      <p>
        Sorry, we couldn&apos;t find that page. It might be missing, or we had a temporary error
        generating it.
      </p>
      <div className="flex flex-wrap gap-4">
        <Button type="secondary" className="p-4" onClick={() => setCommandMenuOpen(true)}>
          Search for page
        </Button>
        <Button type="secondary" className="p-4" asChild>
          <Link
            href="https://github.com/supabase/supabase/issues/new?assignees=&labels=documentation&projects=&template=2.Improve_docs.md"
            target="_blank"
            rel="noreferrer noopener"
            className="no-underline"
          >
            Report missing page
          </Link>
        </Button>
      </div>
      <section
        aria-labelledby="empty-page-recommendations"
        aria-hidden={!hasRecommendations}
        className={cn(
          '[transition:opacity_300ms_100ms_cubic-bezier(0.4,0,0.2,1),transform_300ms_cubic-bezier(0.4,0,0.2,1)] origin-top',
          hasRecommendations
            ? 'opacity-100 scale-y-100'
            : 'opacity-0 scale-y-0 motion-reduce:scale-y-100'
        )}
      >
        <h2 id="empty-page-recommendations">Are you looking for...?</h2>
        <ul className="not-prose grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
          {('results' in searchState ? searchState.results : ([] as any[]))
            .filter(({ title }) => !!title)
            .slice(0, 6)
            .map(({ path, title, subtitle, description }) => (
              <ButtonCard
                key={path}
                to={path}
                title={title}
                description={subtitle || description || undefined}
              />
            ))}
        </ul>
      </section>
    </article>
  )
}

export default GuideErrorPage
