import { Database } from '@/types/supabase'
import EmptyState from './EmptyState'
import Thread from './Thread'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type ThreadType = Database['public']['Tables']['threads']['Row']

async function Threads() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <p>Error fetching user details</p>

  const { data } = await supabase
    .from('threads')
    .select()
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const threads = data ?? []

  return (
    <div className="flex flex-col gap-y-3">
      {threads.length > 0 ? (
        threads.sort().map((thread) => <Thread key={`thread-item-${thread.id}`} thread={thread} />)
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

export default Threads
