import { clientSdkIds } from '~/content/navigation.references'
import { cliLegacyRedirect } from '~/features/docs/Reference.cli.utils'
import { IA_NAV_FLAG, iaNavRoutePrefix, isIaNavVariant } from '~/features/IaNav/constants'
import { BASE_PATH, PROD_URL } from '~/lib/constants'
import { MARKDOWN_CONTENT_TYPE } from '~/lib/md-alternates'
import MARKDOWN_SLUGS from '~/public/markdown/manifest.json'
import { negotiateMarkdown } from 'common/markdown-negotiation'
import { isbot } from 'isbot'
import { NextResponse, type NextRequest } from 'next/server'

const REFERENCE_PATH = `${BASE_PATH ?? ''}/reference`
const GUIDES_PATH = `${BASE_PATH ?? ''}/guides`
const CLI_PATH = `${REFERENCE_PATH}/cli`
const GUIDES_MARKDOWN_SLUGS = new Set(MARKDOWN_SLUGS)
const REFERENCE_MARKDOWN_LIBS = new Set([...clientSdkIds, 'cli', 'api'])
const LLMS_FILE_NAMES: Record<string, string> = { javascript: 'js' }

function markdownUrl(section: string, lib: string | undefined) {
  if (section !== 'reference' || !lib || !REFERENCE_MARKDOWN_LIBS.has(lib)) {
    return 'https://supabase.com/llms.txt'
  }
  return `https://supabase.com/llms/${LLMS_FILE_NAMES[lib] ?? lib}.txt`
}

function markdownNotFound(pathname: string) {
  const relativePath = pathname.replace(`${BASE_PATH}/`, '').replace(/\.md$/, '')
  const [section, lib] = relativePath.split('/')

  const markdown = `# 404 Not Found

There is no markdown version of \`${BASE_PATH}/${relativePath}\`.

- HTML page: <${PROD_URL}/${relativePath}>
- Markdown: <${markdownUrl(section, lib)}>
`

  return new NextResponse(markdown, {
    status: 404,
    headers: {
      'Content-Type': MARKDOWN_CONTENT_TYPE,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

/**
 * One page per CLI command: old single-page section URLs (and the former v3
 * prerelease prefix) move permanently, and `<page>.md` serves its Markdown twin.
 */
function cliProxy(request: NextRequest, url: URL) {
  const isMdSuffix = url.pathname.endsWith('.md')
  const segments = url.pathname
    .slice(CLI_PATH.length)
    .replace(/\.md$/, '')
    .split('/')
    .filter(Boolean)

  const legacyPath = cliLegacyRedirect(segments)
  if (legacyPath) {
    const redirectUrl = new URL(url)
    redirectUrl.pathname = `${BASE_PATH ?? ''}${legacyPath}${isMdSuffix ? '.md' : ''}`
    return NextResponse.redirect(redirectUrl, 301)
  }

  const decision = negotiateMarkdown(
    { acceptHeader: request.headers.get('accept') ?? '' },
    { hasMarkdownVariant: true, isMarkdownSuffix: isMdSuffix }
  )
  if (decision === 'not-acceptable') {
    return new NextResponse('Not Acceptable', {
      status: 406,
      headers: { 'Cache-Control': 'no-store', Vary: 'Accept' },
    })
  }
  if (decision === 'markdown') {
    const rewriteUrl = new URL(url)
    rewriteUrl.pathname = [`${BASE_PATH ?? ''}/api/cli-md`, ...segments].join('/')
    return NextResponse.rewrite(rewriteUrl)
  }

  return NextResponse.next()
}

function forcedVariantRewrite(url: URL, path: string) {
  const variant = url.searchParams.get(IA_NAV_FLAG)
  if (!isIaNavVariant(variant) || variant === 'control') return null

  const rewriteUrl = new URL(url)
  rewriteUrl.pathname = `${BASE_PATH ?? ''}${iaNavRoutePrefix(variant)}${path}`
  return NextResponse.rewrite(rewriteUrl)
}

export function proxy(request: NextRequest) {
  const url = new URL(request.url)
  const { pathname } = url

  if (
    pathname === CLI_PATH ||
    pathname.startsWith(`${CLI_PATH}/`) ||
    pathname === `${CLI_PATH}.md`
  ) {
    return cliProxy(request, url)
  }

  if (pathname === (BASE_PATH || '/')) {
    return forcedVariantRewrite(url, '') ?? NextResponse.next()
  }

  if (pathname.startsWith(GUIDES_PATH + '/')) {
    const isMdSuffix = pathname.endsWith('.md')
    const slug = pathname.replace(`${GUIDES_PATH}/`, '').replace(/\.md$/, '')
    const decision = negotiateMarkdown(
      { acceptHeader: request.headers.get('accept') ?? '' },
      { hasMarkdownVariant: GUIDES_MARKDOWN_SLUGS.has(slug), isMarkdownSuffix: isMdSuffix }
    )

    if (decision === 'not-acceptable') {
      return new NextResponse('Not Acceptable', {
        status: 406,
        headers: { 'Cache-Control': 'no-store', Vary: 'Accept' },
      })
    }

    if (decision === 'markdown') {
      const rewriteUrl = new URL(url)
      rewriteUrl.pathname = `${BASE_PATH ?? ''}/api/guides-md/${slug}`
      return NextResponse.rewrite(rewriteUrl)
    }

    const variantRewrite =
      !isMdSuffix && GUIDES_MARKDOWN_SLUGS.has(slug)
        ? forcedVariantRewrite(url, `/guides/${slug}`)
        : null
    if (variantRewrite) return variantRewrite
  }

  // Only CLI reference pages (handled above) have per-page markdown, so every other
  // reference .md is a guess.
  if (pathname.endsWith('.md')) {
    return markdownNotFound(pathname)
  }

  if (!pathname.startsWith(REFERENCE_PATH)) {
    return NextResponse.next()
  }

  if (isbot(request.headers.get('user-agent'))) {
    let [, lib, maybeVersion, ...slug] = pathname.replace(REFERENCE_PATH, '').split('/')

    if (clientSdkIds.includes(lib)) {
      const version = /^v\d+$/.test(maybeVersion) ? maybeVersion : undefined
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

  const [, lib, maybeVersion] = pathname.replace(REFERENCE_PATH, '').split('/')

  // Spike (DOCS-1268): only the bare /reference/api needs normalizing now.
  // /reference/api/<slug> has its own statically generated page — don't
  // collapse it back to the monolith.
  if (lib === 'api' && !maybeVersion) {
    const rewritePath = [REFERENCE_PATH, 'api'].join('/')
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  if (lib?.startsWith('self-hosting-')) {
    const rewritePath = [REFERENCE_PATH, lib].join('/')
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  if (clientSdkIds.includes(lib)) {
    const version = /^v\d+$/.test(maybeVersion) ? maybeVersion : null
    const rewritePath = [REFERENCE_PATH, lib, version].filter(Boolean).join('/')
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/reference/:path*', '/guides/:path*'],
}
