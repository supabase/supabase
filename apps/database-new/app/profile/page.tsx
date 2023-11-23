import dayjs from 'dayjs'
import relativeTime from 'dayjs'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import EmptyState from './EmptyState'
import { deleteThread } from '@/lib/actions'

dayjs.extend(relativeTime)

const Profile = async () => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data } = await supabase.from('threads').select().eq('user_id', user.id)
  const threads = data ?? []

  async function handleThreadActions(formData: FormData) {
    'use server'

    const action = formData.get('action') as string
    const threadID = formData.get('threadID') as string

    if (!threadID) return

    if (action === 'delete') {
      deleteThread(threadID)
    }
  }

  return (
    <div className="grid grid-cols-4 gap-x-8 py-6 xl:py-12 gap-y-6 xl:gap-y-0">
      <div className="col-span-4 xl:col-span-1 flex flex-col gap-y-6">
        <div className="flex items-center gap-x-4">
          <div
            className="border border-foreground-lighter rounded-full w-12 h-12 bg-no-repeat bg-center bg-cover"
            style={{ backgroundImage: `url('${user.user_metadata.avatar_url}')` }}
          />
          <div className="flex flex-col">
            <p className="text-lg">{user.user_metadata.full_name}</p>
            <p className="text-foreground-light">@{user.user_metadata.user_name}</p>
          </div>
        </div>
      </div>

      <div className="col-span-4 xl:col-span-3 flex flex-col gap-y-4">
        <p>Past conversations</p>

        <div className="w-full h-px border-t" />

        <div className="flex flex-col gap-y-3">
          {threads.length > 0 ? (
            threads.map((thread) => {
              const formattedTimeAgo = timeAgo(thread.created_at)

              return (
                <div
                  key={thread.id}
                  className="group flex items-center justify-between border rounded w-full px-4 py-2 transition bg-surface-100 hover:bg-surface-200"
                >
                  <div className="flex flex-col gap-y-1">
                    <Link
                      className="text-sm hover:underline"
                      href={`/${thread.thread_id}/${thread.run_id}`}
                    >
                      {thread.thread_title}
                    </Link>
                    <p className="text-xs text-foreground-light">Last updated {formattedTimeAgo}</p>
                  </div>

                  <form action={handleThreadActions} className="flex gap-2 items-center">
                    <input type="hidden" name="threadID" value={thread.thread_id} />
                    <button type="submit" name="action" value="delete">
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </form>
                </div>
              )
            })
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}
export default Profile
