import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { Suspense } from 'react'
import { GenericSkeletonLoader } from './Shimmer'
import Link from 'next/link'
const RecentlyGenerated = async () => {
  const supabase = createClient()
  const { data: threads } = await supabase
    .from('profile_threads')
    .select()
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(18)

  // @todo
  // these probably need to be picked randomly somehow so
  // the same user doesn't show up every time if they've
  // generated a bunch of threads

  return (
    <div className="mt-12">
      <h2 className="font-bold text-lg">Recently generated</h2>
      <Suspense fallback={<GenericSkeletonLoader />}>
        <div className="container max-w-4xl mx-auto mt-4">
          <ul className="grid gap-4 grid-cols-3">
            {threads?.map((thread) => (
              <li key={thread.thread_id}>
                <Link
                  href={`${thread.thread_id}/${thread.message_id}`}
                  className="flex items-center gap-2 py-2 px-4 bg-surface-200 rounded-md hover:shadow-md transition-all"
                >
                  {thread.user_avatar_url && (
                    <Image
                      alt="avatar"
                      src={thread.user_avatar_url}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  )}
                  <span className="truncate text-sm">{thread.thread_title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Suspense>
    </div>
  )
}

export default RecentlyGenerated
