import { Tables } from '~/lib/contribute.types'

export type Thread = Tables<'contribute_threads'>

export type ThreadSource = 'discord' | 'reddit' | 'github'

export interface ThreadRow {
  id: string
  title: string
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
}
