import { isbot } from 'isbot'
import { NextResponse, type NextRequest } from 'next/server'

import { clientSdkIds } from '~/content/navigation.references'
import { START_AGENT_FORMAT_PARAM } from '~/features/start/StartAgent.constants'
import { BASE_PATH } from '~/lib/constants'

const REFERENCE_PATH = `${BASE_PATH ?? ''}/reference`

const GUIDES_PATH = `${BASE_PATH ?? ''}/guides`

const START_PATH = `${BASE_PATH ?? ''}/start`

const START_MARKDOWN_PATH = `${START_PATH}.md`

export function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const isBotRequest = isbot(request.headers.get('user-agent'))

  const requestsMarkdown =
    request.headers.get('Accept')?.includes('text/markdown') || url.pathname.endsWith('.md')

  if (url.pathname === START_PATH || url.pathname === START_MARKDOWN_PATH) {
    const wantsMarkdown = requestsMarkdown || url.pathname === START_MARKDOWN_PATH

    if (wantsMarkdown || isBotRequest) {
      const rewriteUrl = new URL(url)
      rewriteUrl.pathname = `${BASE_PATH ?? ''}/api/start`
      rewriteUrl.searchParams.set(START_AGENT_FORMAT_PARAM, wantsMarkdown ? 'markdown' : 'html')
      return NextResponse.rewrite(rewriteUrl)
    }
  }

  // Serve pre-generated .md files before the [[...slug]] page route can intercept them
  if (url.pathname.startsWith(GUIDES_PATH + '/') && requestsMarkdown) {
    const slug = url.pathname.replace(`${GUIDES_PATH}/`, '').replace(/\.md$/, '')
    const rewriteUrl = new URL(url)
    rewriteUrl.pathname = `${BASE_PATH ?? ''}/api/guides-md/${slug}`
    return NextResponse.rewrite(rewriteUrl)
  }

  if (!url.pathname.startsWith(REFERENCE_PATH)) {
    return NextResponse.next()
  }

  if (isBotRequest) {
    let [, lib, maybeVersion, ...slug] = url.pathname.replace(REFERENCE_PATH, '').split('/')

    if (clientSdkIds.includes(lib)) {
      const version = /v\d+/.test(maybeVersion) ? maybeVersion : undefined
      if (!version) {
        slug = [maybeVersion, ...slug]
      }

      if (slug.length > 0) {
        const rewriteUrl = new URL(url)
        rewriteUrl.pathname = (BASE_PATH ?? '') + '/api/crawlers'
        return NextResponse.rewrite(rewriteUrl)
      }
    }
  }

  const [, lib, maybeVersion] = url.pathname.replace(REFERENCE_PATH, '').split('/')

  if (lib === 'cli') {
    const rewritePath = [REFERENCE_PATH, 'cli'].join('/')
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  if (lib === 'api') {
    const rewritePath = [REFERENCE_PATH, 'api'].join('/')
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  if (lib?.startsWith('self-hosting-')) {
    const rewritePath = [REFERENCE_PATH, lib].join('/')
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  if (clientSdkIds.includes(lib)) {
    const version = /v\d+/.test(maybeVersion) ? maybeVersion : null
    const rewritePath = [REFERENCE_PATH, lib, version].filter(Boolean).join('/')
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/reference/:path*', '/guides/:path*', '/start', '/start.md'],
}
