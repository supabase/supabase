import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import RealtimePosts from './realtime-posts'
import NewPost from './new-post'

import type { Database } from '@/lib/database.types'

export default async function ServerComponent() {
  const supabase = createServerComponentClient<Database>({
    cookies,
  })
  const { data } = await supabase.from('posts').select('*')

  return (
    <>
      <NewPost />
      <RealtimePosts serverPosts={data ?? []} />
    </>
  )
}
