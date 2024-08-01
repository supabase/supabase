'use client'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { type SupabaseClient } from '@supabase/supabase-js'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useCommandMenu } from '@ui-patterns/Cmdk'
import { GenericSkeletonLoader } from '@ui-patterns/ShimmeringLoader'
import { type DocsSearchResult } from 'common'
import { Button, cn } from 'ui'

import ButtonCard from '~/components/ButtonCard'

function SearchButton() {
  const { setIsOpen: setCommandMenuOpen } = useCommandMenu()

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

function Recommendations({ page }: { page: string }) {
  const supabase = useSupabaseClient()
  const [recommendations, setRecommendations] = useState(
    [] as Array<Omit<DocsSearchResult, 'sections'>>
  )

  const fetched = useRef(false)

  useEffect(() => {
    getRecommendations(page, supabase).then((data) => {
      if (!fetched.current) {
        setRecommendations(data)
        fetched.current = true
      }
    })
  }, [page, supabase])

  return (
    <section aria-labelledby="empty-page-recommendations" className="min-h-96 mt-20">
      <h2 id="empty-page-recommendations">Are you looking for...?</h2>
      {!fetched.current && <LoadingState />}
      {fetched.current && recommendations.length === 0 && <NoResults />}
      {fetched.current && recommendations.length > 0 && (
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
