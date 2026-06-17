import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'common'
import { pick } from 'lodash-es'

type FeedbackComment = {
  id: number
  title: string
  comment: string
}

const updateDocsFeedbackComment = (
  supabase: SupabaseClient<Database>,
  { id, title, comment }: FeedbackComment
) => supabase.from('feedback').update({ title, comment }).eq('id', id)

/**
 * Gets the tab selection state from the URL search params.
 *
 * Sanitizes by including only those search params that are explicitly marked
 * as query groups.
 */
const getSanitizedTabParams = () => {
  const searchParams = new URLSearchParams(window.location.search)
  const queryGroups = searchParams.getAll('queryGroups')

  return pick(Object.fromEntries(searchParams.entries()), queryGroups)
}

export { updateDocsFeedbackComment, getSanitizedTabParams }
