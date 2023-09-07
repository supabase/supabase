'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import type { Database } from '@/lib/database.types'

type Post = Database['public']['Tables']['posts']['Row']

export default function RealtimePost({ serverPost }: { serverPost: Post }) {
  const supabase = createClientComponentClient<Database>()
  const [post, setPost] = useState(serverPost)

  useEffect(() => {
    setPost(serverPost)
  }, [serverPost])

  useEffect(() => {
    const channel = supabase
      .channel('realtime post')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${post.id}`,
        },
        (payload) => {
          setPost(payload.new as Post)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, post, setPost])

  return <pre>{JSON.stringify(post, null, 2)}</pre>
}
