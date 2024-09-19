'use client'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { type SupabaseClient } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { useSetCommandMenuOpen } from '@ui-patterns/CommandMenu'
import { GenericSkeletonLoader } from '@ui-patterns/ShimmeringLoader'
import { type DocsSearchResult } from 'common'
import { Button, cn } from 'ui'

import ButtonCard from '~/components/ButtonCard'

function SearchButton() {
  const setCommandMenuOpen = useSetCommandMenuOpen()

  return (
    <Button type="primary" size="small" onClick={() => setCommandMenuOpen(true)}>
      Search for page
    </Button>
  )
}

async function getRecommendations(page: string, supabase: SupabaseClient) {
  try {
    const query = decodeURIComponent(page.replace(/^\/(?:guides|reference)\//, '')).replace(
      /[_\/-]/g,
      ' '
    )
    if (!query) return []

    const { data, error } = await supabase.rpc('docs_search_fts', { query })
    if (error || !data?.length) return []
    return data as Array<Omit<DocsSearchResult, 'sections'>>
  } catch (err) {
    console.error(err)
    return []
  }
}

function Recommendations() {
  const pathname = usePathname()
  const supabase = useSupabaseClient()

  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState(
    [] as Array<Omit<DocsSearchResult, 'sections'>>
  )

  useEffect(() => {
    if (!pathname) return

    let stale = false

    getRecommendations(pathname, supabase).then((data) => {
      if (!stale) {
        setRecommendations(data)
        setLoading(false)
      }
    })

    return () => {
      stale = true
    }
  }, [pathname, supabase])

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

export { SearchButton, Recommendations }
