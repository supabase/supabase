'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import type { Database } from '@/lib/database.types'
import Link from 'next/link'
type Post = Database['public']['Tables']['posts']['Row']

export default function RealtimePosts({ serverPosts }: { serverPosts: Post[] }) {
  const [posts, setPosts] = useState(serverPosts)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    setPosts(serverPosts)
  }, [serverPosts])

  useEffect(() => {
    const channel = supabase
      .channel('*')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) =>
        setPosts((posts) => [...posts, payload.new as Post])
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, setPosts, posts])

  return (
    <>
      {posts.map((post) => (
        <div key={post.id}>
          <Link href={`/${post.id}`}>{post.content}</Link>
        </div>
      ))}
    </>
  )
}
