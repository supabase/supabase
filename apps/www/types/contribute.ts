import { Tables } from '~/lib/contribute.types'

export type Thread = Tables<'contribute_threads'>

export type ThreadSource = 'discord' | 'reddit' | 'github'

export interface SimilarSolvedThread {
  subject: string
  summary: string
  root_cause: string
  similarity: number
  thread_key: string
  user_action: string
  anti_pattern: string
  match_reason: string
  problem_type: string
  product_areas: string[]
  stack: string[]
  solution_type: string
  match_keywords: string[]
  solution_steps: string[]
  error_signature: string | null
  proposed_solution: string
  problem_description: string
  external_activity_url: string
}

export interface ThreadRow {
  id: string
  title: string
  conversation: string
  user: string
  channel: ThreadSource
  channelDisplayName: string
  tags: string[]
  product_areas: string[]
  stack: string[]
  posted: string
  source: ThreadSource
  external_activity_url: string
  category: string | null
  sub_category: string | null
  summary: string | null
  thread_key: string | null
  message_count: number | null
  similar_solved_threads: SimilarSolvedThread[] | null
}

export type LeaderboardPeriod = 'all' | 'year' | 'quarter' | 'month' | 'week' | 'today'

export type LeaderboardRow = {
  author: string | null // sometimes author can be null
  reply_count: number // bigint comes back as number via supabase-js
}

export type SimilarThreadFeedbackReaction = 'positive' | 'negative'

export interface SimilarThreadFeedbackSubmission {
  parentThreadId: string // the thread being viewed (e.g. "860-6_dm")
  similarThreadKey?: string | null // optional for section-level feedback
  reaction: SimilarThreadFeedbackReaction // positive = thumbs-up, negative = thumbs-down
  feedback?: string | null // optional freeform text from dialog
}

export interface SimilarThreadFeedbackResult {
  success: boolean
  id?: string // returned from insert for subsequent update
}
