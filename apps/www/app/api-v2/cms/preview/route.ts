import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const draft = await draftMode()
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')
  const path = searchParams.get('path') || 'blog'

  // Get the expected secret with fallback to match CMS configuration
  const expectedSecret = process.env.CMS_PREVIEW_SECRET

  if (secret !== expectedSecret) {
    console.error('[preview] Token mismatch:', {
      received: secret,
      expected: expectedSecret,
    })
    return new Response(
      `Invalid token. Expected: ${expectedSecret?.slice(0, 3)}..., Received: ${secret?.slice(0, 3)}...`,
      { status: 401 }
    )
  }

  if (!slug) {
    console.error('[preview] No slug provided')
    return new Response('No slug in the request', { status: 401 })
  }

  // Enable Draft Mode by setting the cookie
  draft.enable()

  // Redirect to the path from the fetched post
  redirect(`/${path}/${slug}`)
}
