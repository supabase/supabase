import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { SITE_ORIGIN } from '~/lib/constants'

export async function GET(request: Request) {
  const draft = await draftMode()
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const path = searchParams.get('path') || 'blog'

  // Redirect to the path from the fetched post
  const redir = slug ? `/${path}/${slug}` : `/${path}`

  // Disable Draft Mode by clearing the cookie
  draft.disable()

  try {
    const parsed = new URL(redir, SITE_ORIGIN)
    // Only allow paths that stay on the origin
    if (parsed.origin === SITE_ORIGIN) {
      redirect(parsed.pathname)
    }
  } catch {
    // Invalid URL
  }
  redirect(SITE_ORIGIN)
}
