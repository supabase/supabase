import { createClient } from '@supabase/supabase-js'
import { DocsSearchResult, type Database } from 'common'
import { NotFound } from '~/features/recommendations/NotFound.client'

const NotFoundPage = async ({ searchParams: { page } }: { searchParams: { page?: string } }) => {
  const recommendations = page ? await getRecommendations(page) : null

  return <NotFound recommendations={recommendations} />
}

const getRecommendations = async (page: string) => {
  const query = decodeURIComponent(page.replace(/^\/(?:guides|reference)\//, '')).replace(
    /[_\/-]/g,
    ' '
  )
  if (!query) return null

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase.rpc('docs_search_fts', { query })
  if (error || !data?.length) return null
  return data as Omit<DocsSearchResult, 'sections'>[]
}

export default NotFoundPage
