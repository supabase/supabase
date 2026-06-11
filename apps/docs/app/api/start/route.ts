import { NextResponse } from 'next/server'

import {
  buildStartAgentHtml,
  buildStartAgentMarkdown,
  START_AGENT_FORMAT_PARAM,
} from '~/features/start/StartAgentMarkdown'

export function GET(request: Request) {
  const url = new URL(request.url)
  const format = url.searchParams.get(START_AGENT_FORMAT_PARAM)
  url.searchParams.delete(START_AGENT_FORMAT_PARAM)

  const markdown = buildStartAgentMarkdown(url)

  if (format === 'html') {
    return new NextResponse(buildStartAgentHtml(markdown), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  }

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
