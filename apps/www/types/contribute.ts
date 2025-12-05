import { Tables } from '~/lib/contribute.types'

export type Thread = Tables<'contribute_threads'>

export type ThreadSource = 'discord' | 'reddit' | 'github'

export interface ThreadRow {
  id: string
  title: string
  conversation: string
  user: string
  channel: ThreadSource
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
}
