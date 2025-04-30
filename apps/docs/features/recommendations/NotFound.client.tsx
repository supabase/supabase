'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { useDocsSearch, type DocsSearchResult } from 'common'
import { Button, cn } from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import ButtonCard from '~/components/ButtonCard'

function SearchButton() {
  const setCommandMenuOpen = useSetCommandMenuOpen()

  return (
    <Button type="primary" size="small" onClick={() => setCommandMenuOpen(true)}>
      Search for page
    </Button>
  )
}

function Recommendations() {
  const pathname = usePathname()

  const { searchState: state, handleDocsSearch: handleSearch } = useDocsSearch()

  const loading = state.status === 'initial' || state.status === 'loading'
  const recommendations =
    state.status === 'partialResults' || state.status === 'fullResults' ? state.results : []

  useEffect(() => {
    if (!pathname) return

    const query = decodeURIComponent(pathname.replace(/^\/(?:guides|reference)\//, '')).replace(
      /[_\/-]/g,
      ' '
    )

    handleSearch(query)
  }, [handleSearch, pathname])

  return (
    <section aria-labelledby="empty-page-recommendations" className="min-h-96 mt-20">
      <h2 id="empty-page-recommendations">Are you looking for...?</h2>
      {loading && <LoadingState />}
      {!loading && recommendations.length === 0 && <NoResults />}
      {!loading && recommendations.length > 0 && (
        <RecommendationsList recommendations={recommendations} />
      )}
    </section>
  )
}

function LoadingState() {
  return <GenericSkeletonLoader />
}

function NoResults() {
  return <span>No recommendations found.</span>
}

function RecommendationsList({
  recommendations,
}: {
  recommendations: Array<Omit<DocsSearchResult, 'sections'>>
}) {
  return (
    <ul className={cn('not-prose', 'grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4')}>
      {recommendations
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
  )
}

export { Recommendations, SearchButton }
