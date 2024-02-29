import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export interface PageProps {
  params: {
    slug: string
  }
}

export default async function Page({ params }: PageProps) {
  const supabase = createClient()
  // maybe a mis-use of profile_threads here
  // it has both the thread_id and the latest message_id

  // need to handle error fallback here
  const { data, error } = await supabase
    .from('profile_threads')
    .select()
    .ilike('slug', `%${params.slug}%`)
    .single()

  // immediately redirect to the thread
  redirect(`/${data?.thread_id}/${data?.message_id}`)
}
