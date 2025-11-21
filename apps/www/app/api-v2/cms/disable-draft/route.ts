import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const draft = await draftMode()
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const path = searchParams.get('path') || 'blog'

  // Disable Draft Mode by clearing the cookie
  draft.disable()

  // Redirect to the path from the fetched post
  redirect(slug ? `/${path}/${slug}` : `/${path}`)
}
