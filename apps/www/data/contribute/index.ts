import { createClient } from '@supabase/supabase-js'
import type { Thread, ThreadRow, ThreadSource } from '~/types/contribute'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_CONTRIBUTE_URL as string
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_CONTRIBUTE_PUBLISHABLE_KEY as string

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

function normalizeSource(source: string | null): ThreadSource {
  if (!source) return 'discord'
  return source.toLowerCase().trim() as ThreadSource
}

function mapThreadRowToThread(row: Thread): ThreadRow {
  const firstMsgTime = row.first_msg_time ? new Date(row.first_msg_time) : null
  const source = normalizeSource(row.source)

  return {
    id: row.thread_id,
    title: row.subject ?? row.title ?? '',
    user: row.author,
    channel: source,
    tags: row.product_areas ?? [],
    product_areas: row.product_areas ?? [],
    stack: row.stack ?? [],
    posted:
      firstMsgTime && !isNaN(firstMsgTime.getTime())
        ? formatTimeAgo(firstMsgTime)
        : row.created_at
          ? formatTimeAgo(new Date(row.created_at))
          : '',
    source,
    external_activity_url: row.external_activity_url ?? '#',
    category: row.category,
    sub_category: row.sub_category,
    summary: row.summary,
  }
}

export async function getUnansweredThreads(
  product_area?: string,
  channel?: string,
  stack?: string
): Promise<ThreadRow[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
  const since = twentyFourHoursAgo.toISOString()

  let query = supabase
    .from('contribute_threads')
    .select(
      'thread_id, subject, status, author, external_activity_url, created_at, source, product_areas, stack, category, sub_category, summary, first_msg_time, message_count'
    )
    .gte('first_msg_time', since)
    .in('status', ['unanswered', 'unresolved'])

  if (product_area) {
    query = query.contains('product_areas', [product_area])
  }

  if (stack) {
    query = query.contains('stack', [stack])
  }

  if (channel) {
    console.log('channel', channel)
    query = query.eq('source', channel.toLowerCase())
  }

  const { data, error } = await query
    // .gte("created_at", since)
    .order('first_msg_time', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching threads:', error)
    throw error
  }

  const threads = (data ?? []) as Thread[]
  return threads.map(mapThreadRowToThread)
}

export async function getAllProductAreas(): Promise<string[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from('contribute_threads')
    .select('product_areas')
    .in('status', ['unanswered', 'unresolved'])

  if (error) {
    console.error('Error fetching product areas:', error)
    return []
  }

  const areas = new Set<string>()
  data?.forEach((row: { product_areas: string[] | null }) => {
    if (row.product_areas && Array.isArray(row.product_areas)) {
      row.product_areas.forEach((area: string) => areas.add(area))
    }
  })

  return Array.from(areas).sort()
}

export async function getAllStacks(): Promise<string[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from('contribute_threads')
    .select('stack')
    .in('status', ['unanswered', 'unresolved'])

  if (error) {
    console.error('Error fetching stacks:', error)
    return []
  }

  const stacks = new Set<string>()
  data?.forEach((row: { stack: string[] | null }) => {
    if (row.stack && Array.isArray(row.stack)) {
      row.stack.forEach((stack: string) => stacks.add(stack))
    }
  })

  return Array.from(stacks).sort()
}
