import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const draft = await draftMode()
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')
  const path = searchParams.get('path') || 'blog'

  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 })
  }

  if (!slug) {
    return new Response('No slug in the request', { status: 401 })
  }

  // Enable Draft Mode by setting the cookie
  draft.enable()

  // Redirect to the path from the fetched post
  redirect(`/${path}/${slug}`)
}
