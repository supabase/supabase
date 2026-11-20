import { cliPageMarkdown, getCliStaticParams, resolveCliPage } from '~/features/docs/Reference.cli'
import { LATEST_CLI_VERSION } from '~/features/docs/Reference.cli.utils'
import { MARKDOWN_CONTENT_TYPE } from '~/lib/md-alternates'
import { NextResponse } from 'next/server'

// Markdown twin of every CLI reference page. The docs proxy rewrites
// `/reference/cli/<page>.md`, and pages requested with a Markdown Accept header, here.
export const dynamic = 'force-static'

export async function generateStaticParams() {
  return (await getCliStaticParams()).map(({ slug }) => ({ slug: slug.slice(1) }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params
  const [first, ...rest] = slug
  const hasVersion = /^v\d+$/.test(first ?? '')
  const version = hasVersion ? first : LATEST_CLI_VERSION
  const page = await resolveCliPage(version, hasVersion ? rest : slug)

  if (!page) {
    return new NextResponse(
      `# 404 Not Found\n\nThere is no CLI reference page at \`${slug.join('/')}\`.\n`,
      {
        status: 404,
        headers: { 'Content-Type': MARKDOWN_CONTENT_TYPE, 'Cache-Control': 'no-store' },
      }
    )
  }

  return new NextResponse(await cliPageMarkdown(version, page), {
    headers: {
      'Content-Type': MARKDOWN_CONTENT_TYPE,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      Vary: 'Accept',
    },
  })
}
