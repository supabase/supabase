import Link from 'next/link'
import supabase from '../../utils/supabase'

// do not cache this page
export const revalidate = 0

export default async function Posts() {
  const { data: posts } = await supabase.from('posts').select('id, title')

  if (!posts) {
    return <p>No posts found.</p>
  }

  return posts.map((post) => (
    <p key={post.id}>
      <Link href={`/static/${post.id}`}>{post.title}</Link>
    </p>
  ))
}
