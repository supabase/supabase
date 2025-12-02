import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_CONTRIBUTE_URL as string
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_CONTRIBUTE_PUBLISHABLE_KEY as string

export interface Thread {
  id: string
  title: string
  user: string
  channel: string
  tags: string[]
  product_areas: string[]
  posted: string
  source: 'discord' | 'reddit' | 'github'
  external_activity_url: string
  category: string | null
  sub_category: string | null
  summary: string | null
}

type ThreadRow = {
  thread_id: string
  title: string
  author: string
  external_activity_url: string | null
  created_at: string
  source: string | null
  product_areas: string[] | null
  category: string | null
  sub_category: string | null
  summary: string | null
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

function normalizeSource(source: string | null): 'discord' | 'reddit' | 'github' {
  if (!source) return 'discord'
  const normalized = source.toLowerCase().trim()
  if (normalized === 'reddit') return 'reddit'
  if (normalized === 'github') return 'github'
  return 'discord'
}

function mapThreadRowToThread(row: ThreadRow): Thread {
  const createdAt = new Date(row.created_at)
  const source = normalizeSource(row.source)

  return {
    id: row.thread_id,
    title: row.title,
    user: row.author,
    channel: row.source?.toUpperCase() ?? '',
    tags: row.product_areas ?? [],
    product_areas: row.product_areas ?? [],
    posted: isNaN(createdAt.getTime()) ? '' : formatTimeAgo(createdAt),
    source,
    external_activity_url: row.external_activity_url ?? '#',
    category: row.category,
    sub_category: row.sub_category,
    summary: row.summary,
  }
}

export async function getUnansweredThreads(product_area?: string): Promise<Thread[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
  const since = twentyFourHoursAgo.toISOString()

  let query = supabase
    .from('contribute_threads')
    .select(
      'thread_id, title, author, external_activity_url, created_at, source, product_areas, category, sub_category, summary'
    )
    .in('status', ['unanswered', 'unresolved'])

  if (product_area) {
    query = query.contains('product_areas', [product_area])
  }

  const { data, error } = await query
    // .gte("created_at", since)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching threads:', error)
    throw error
  }

  const threads = (data ?? []) as ThreadRow[]
  return threads.map(mapThreadRowToThread)
}
