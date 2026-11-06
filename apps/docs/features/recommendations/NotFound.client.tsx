'use client'

import ButtonCard from '~/components/ButtonCard'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useDocsSearchV2, type DocsSearchV2Result } from 'common'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Button, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { SearchV2Dialog, useSearchV2Dialog } from '@/features/SearchV2'
import { SEARCH_V2_ENDPOINT } from '@/features/SearchV2/constants'

function SearchButton() {
  const { open, openDialog, handleOpenChange } = useSearchV2Dialog()

  return (
    <>
      <Button variant="primary" size="small" onClick={() => openDialog('not_found_button')}>
        Search for page
      </Button>
      <SearchV2Dialog open={open} onOpenChange={handleOpenChange} />
    </>
  )
}

function Recommendations() {
  const pathname = usePathname()

  const { searchState: state, handleDocsSearch: handleSearch } = useDocsSearchV2({
    endpoint: SEARCH_V2_ENDPOINT,
  })

  const loading = state.status === 'initial' || state.status === 'loading'
  const recommendations = state.status === 'results' ? uniqueByPath(state.results) : []

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

// results are per heading, so a page can match more than once
function uniqueByPath(results: DocsSearchV2Result[]) {
  return results.filter(
    (result, index) => results.findIndex(({ path }) => path === result.path) === index
  )
}

function LoadingState() {
  return <GenericSkeletonLoader />
}

function NoResults() {
  return <span>No recommendations found.</span>
}

function RecommendationsList({ recommendations }: { recommendations: DocsSearchV2Result[] }) {
  const pathname = usePathname()
  const sendTelemetryEvent = useSendTelemetryEvent()

  return (
    <ul className={cn('not-prose', 'grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4')}>
      {recommendations
        .filter(({ title }) => !!title)
        .slice(0, 6)
        .map(({ path, title, excerpt }) => (
          <ButtonCard
            key={path}
            to={path}
            title={title}
            description={excerpt || undefined}
            onClick={() =>
              sendTelemetryEvent({
                action: 'docs_404_recommendation_clicked',
                properties: { destinationPath: path, sourcePath: pathname ?? '' },
              })
            }
          />
        ))}
    </ul>
  )
}

export { Recommendations, SearchButton }
