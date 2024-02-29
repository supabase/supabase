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

  const { data, error } = await supabase
    .from('profile_threads')
    .select()
    .eq('thread_id', '942ac327-f9bf-44a7-9310-0d0f5b04cbe4')

    //.ilike('thread_id', `%${params.slug}%`)
    .single()

  // immediately redirect to the thread
  redirect(`/${data?.thread_id}/${data?.message_id}`)
}
