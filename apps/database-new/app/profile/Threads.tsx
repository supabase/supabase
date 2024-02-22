import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'
import EmptyState from './EmptyState'
import Thread from './Thread'

export type ThreadViewType = Database['public']['Views']['profile_threads']['Row']
export type ThreadType = Database['public']['Tables']['threads']['Row']

async function Threads() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <p>Error fetching user details</p>

  const { data } = await supabase
    .from('profile_threads')
    .select()
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const threads = data ?? []

  return (
    <div className="flex flex-col gap-y-3">
      {threads.length > 0 ? (
        threads
          .sort()
          .map((thread) => <Thread key={`thread-item-${thread.thread_id}`} thread={thread} />)
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

export default Threads
