import { createClient } from '@supabase/supabase-js'
import type {
  LeaderboardPeriod,
  LeaderboardRow,
  Thread,
  ThreadRow,
  ThreadSource,
} from '~/types/contribute'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_CONTRIBUTE_URL as string
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_CONTRIBUTE_PUBLISHABLE_KEY as string

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
    conversation: row.conversation ?? '',
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
    thread_key: row.thread_key ?? null,
    message_count: row.message_count ?? null,
  }
}

export async function getChannelCounts(
  product_area?: string | string[],
  stack?: string | string[],
  search?: string
): Promise<{ all: number; discord: number; reddit: number; github: number }> {
  const supabase = createClient(supabaseUrl, supabasePublishableKey)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30)
  const since = sevenDaysAgo.toISOString()

  let query = supabase
    .from('v_contribute_threads')
    .select('source', { count: 'exact', head: false })

  // When searching, don't apply time/status filters to allow finding any matching threads
  if (!search || !search.trim()) {
    query = query.gte('first_msg_time', since).in('status', ['unanswered', 'unresolved'])
  }

  if (product_area) {
    const areas = Array.isArray(product_area) ? product_area : [product_area]
    query = query.overlaps('product_areas', areas)
  }

  if (stack) {
    const stacks = Array.isArray(stack) ? stack : [stack]
    query = query.overlaps('stack', stacks)
  }

  if (search && search.trim()) {
    const trimmedSearch = search.trim()
    const searchTerm = `%${trimmedSearch}%`
    query = query.ilike('subject', searchTerm)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching channel counts:', error)
    return { all: 0, discord: 0, reddit: 0, github: 0 }
  }

  const threads = (data ?? []) as Array<{ source: string }>
  const discord = threads.filter((t) => normalizeSource(t.source) === 'discord').length
  const reddit = threads.filter((t) => normalizeSource(t.source) === 'reddit').length
  const github = threads.filter((t) => normalizeSource(t.source) === 'github').length

  return {
    all: threads.length,
    discord,
    reddit,
    github,
  }
}

export async function getUnansweredThreads(
  product_area?: string | string[],
  channel?: string,
  stack?: string | string[],
  search?: string,
  offset: number = 0,
  limit: number = 100
): Promise<ThreadRow[]> {
  const supabase = createClient(supabaseUrl, supabasePublishableKey)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30)
  const since = sevenDaysAgo.toISOString()

  let query = supabase
    .from('v_contribute_threads')
    .select(
      'thread_id, subject, status, author, external_activity_url, created_at, source, product_areas, stack, category, sub_category, summary, first_msg_time, message_count'
    )

  // When searching, don't apply time/status filters to allow finding any matching threads
  if (!search || !search.trim()) {
    query = query.gte('first_msg_time', since).in('status', ['unanswered', 'unresolved'])
  }
  // When searching, skip status filter to find threads regardless of status

  if (product_area) {
    const areas = Array.isArray(product_area) ? product_area : [product_area]
    query = query.overlaps('product_areas', areas)
  }

  if (stack) {
    const stacks = Array.isArray(stack) ? stack : [stack]
    query = query.overlaps('stack', stacks)
  }

  if (channel && channel !== 'all') {
    console.log('channel', channel)
    query = query.eq('source', channel.toLowerCase())
  }

  if (search && search.trim()) {
    const trimmedSearch = search.trim()
    const searchTerm = `%${trimmedSearch}%`
    query = query.ilike('subject', searchTerm)
  }

  const { data, error } = await query
    // .gte("created_at", since)
    .order('first_msg_time', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching threads:', error)
    console.error('Query details:', { search, product_area, channel, stack })
    throw error
  }

  const threads = (data ?? []) as Thread[]
  return threads.map(mapThreadRowToThread)
}

export async function getThreadById(id: string): Promise<ThreadRow | null> {
  const supabase = createClient(supabaseUrl, supabasePublishableKey)

  const { data, error } = await supabase
    .from('v_contribute_threads')
    .select(
      'thread_id, subject, status, author, conversation, external_activity_url, created_at, source, product_areas, stack, category, sub_category, summary, first_msg_time, message_count, thread_key'
    )
    .eq('thread_id', id)
    .single()

  if (error) {
    console.error('Error fetching thread:', error)
    return null
  }

  if (!data) {
    return null
  }

  return mapThreadRowToThread(data as Thread)
}

export async function getThreadRepliesById(thread_key: string | null) {
  const supabase = createClient(supabaseUrl, supabasePublishableKey)

  if (!thread_key) {
    return { question: null, replies: [] }
  }

  const { data, error } = await supabase
    .from('contribute_posts')
    .select('id, author, content, ts, external_activity_url, thread_key, kind')
    .eq('thread_key', thread_key)
    .in('kind', ['question', 'reply'])
    .order('ts', { ascending: true })

  if (error) {
    console.error('Error fetching thread posts:', error)
    return { question: null, replies: [] }
  }

  const question = data?.find((post) => post.kind === 'question') || null
  const replies = data?.filter((post) => post.kind === 'reply') || []

  return { question, replies }
}

export async function getAllProductAreas(): Promise<string[]> {
  const supabase = createClient(supabaseUrl, supabasePublishableKey)

  const { data, error } = await supabase
    .from('v_contribute_threads')
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
  const supabase = createClient(supabaseUrl, supabasePublishableKey)

  const { data, error } = await supabase
    .from('v_contribute_threads')
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

export const LEADERBOARD_PERIODS = ['all', 'year', 'quarter', 'month', 'week', 'today'] as const

export async function getLeaderboard(
  period: (typeof LEADERBOARD_PERIODS)[number]
): Promise<LeaderboardRow[]> {
  const supabase = createClient(supabaseUrl, supabasePublishableKey)
  const { data, error } = await supabase.rpc('get_leaderboard', {
    period: period,
  })

  if (error) throw error
  return data ?? []
}

export async function getUserActivity(author: string) {
  const supabase = createClient(supabaseUrl, supabasePublishableKey)

  // Get user's threads
  const { data: threads, error: threadsError } = await supabase
    .from('v_contribute_threads')
    .select(
      'thread_id, subject, status, author, external_activity_url, created_at, source, product_areas, stack, category, sub_category, summary, first_msg_time, message_count, thread_key'
    )
    .eq('author', author)
    .order('first_msg_time', { ascending: false })
    .limit(50)

  if (threadsError) {
    console.error('Error fetching user threads:', threadsError)
  }

  // Get user's replies
  const { data: replies, error: repliesError } = await supabase
    .from('contribute_posts')
    .select('id, author, content, ts, external_activity_url, thread_key, kind')
    .eq('author', author)
    .eq('kind', 'reply')
    .order('ts', { ascending: false })
    .limit(50)

  if (repliesError) {
    console.error('Error fetching user replies:', repliesError)
  }

  // Get thread information for replies
  const threadKeys = replies?.map((r) => r.thread_key).filter(Boolean) ?? []
  let replyThreads: Thread[] = []

  if (threadKeys.length > 0) {
    const { data: replyThreadsData, error: replyThreadsError } = await supabase
      .from('v_contribute_threads')
      .select(
        'thread_id, subject, status, author, external_activity_url, created_at, source, product_areas, stack, category, sub_category, summary, first_msg_time, message_count, thread_key'
      )
      .in('thread_key', threadKeys)

    if (replyThreadsError) {
      console.error('Error fetching reply threads:', replyThreadsError)
    } else {
      replyThreads = (replyThreadsData ?? []) as Thread[]
    }
  }

  return {
    threads: threads ? threads.map((t) => mapThreadRowToThread(t as Thread)) : [],
    replies: replies ?? [],
    replyThreads: replyThreads.map((t) => mapThreadRowToThread(t)),
    stats: {
      threadCount: threads?.length ?? 0,
      replyCount: replies?.length ?? 0,
    },
  }
}

export async function getRelatedThreads(
  threadId: string,
  minSimilarityScore: number = 0.5
): Promise<Array<ThreadRow & { similarityScore: number }>> {
  const supabase = createClient(supabaseUrl, supabasePublishableKey)

  // Get similar thread IDs from the similarity function
  const { data: similarThreads, error } = await supabase.rpc('find_similar_contribute_threads', {
    input_thread_id: threadId,
  })

  if (error) {
    console.error('Error fetching related threads:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    console.error('Thread ID:', threadId)
    return []
  }

  if (!similarThreads || similarThreads.length === 0) {
    return []
  }

  // Filter threads by minimum similarity score
  const filteredThreads = similarThreads.filter(
    (t: { similarity_score: number }) => t.similarity_score >= minSimilarityScore
  )

  if (filteredThreads.length === 0) {
    return []
  }

  // Create a map of thread_id to similarity_score
  const scoresMap = new Map(
    filteredThreads.map((t: { thread_id: string; similarity_score: number }) => [
      t.thread_id,
      t.similarity_score,
    ])
  )

  // Extract thread IDs from the similarity results
  const threadIds = filteredThreads.map((t: { thread_id: string }) => t.thread_id)

  // Fetch full thread data for the similar threads
  const { data: threads, error: threadsError } = await supabase
    .from('v_contribute_threads')
    .select(
      'thread_id, subject, status, author, external_activity_url, created_at, source, product_areas, stack, category, sub_category, summary, first_msg_time, message_count'
    )
    .in('thread_id', threadIds)

  if (threadsError) {
    console.error('Error fetching full thread data:', threadsError)
    return []
  }

  // Map threads to maintain the similarity order and add similarity scores
  const threadsMap = new Map(threads?.map((t) => [t.thread_id, t]) || [])
  const orderedThreads = threadIds
    .map((id) => {
      const thread = threadsMap.get(id)
      const score = scoresMap.get(id)
      if (!thread || score === undefined) return null
      return {
        ...mapThreadRowToThread(thread as Thread),
        similarityScore: score,
      }
    })
    .filter(Boolean) as Array<ThreadRow & { similarityScore: number }>

  return orderedThreads
}
