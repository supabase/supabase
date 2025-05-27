import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  // Disable Draft Mode by clearing the cookie
  draftMode().disable()

  // Redirect to the path from the fetched post
  redirect(slug ? `/blog/${slug}` : '/blog')
}
