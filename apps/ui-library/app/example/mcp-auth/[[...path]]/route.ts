import fs from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

import { PREVIEW_CONFIG, PREVIEW_SUPABASE } from '../preview-mocks'

// Serves the mcp-auth-html block's own files so <BlockPreview> shows the real
// pages rather than a React reproduction of them. The block mounts here as a
// whole directory, which keeps its relative asset paths (../assets/styles.css)
// resolving the same way they do once installed.
//
// Preview URLs mirror the installed layout:
//   /example/mcp-auth/              -> index.html
//   /example/mcp-auth/auth/         -> auth/index.html
//   /example/mcp-auth/oauth/consent/ -> oauth/consent/index.html

const BLOCK_DIR = path.join(process.cwd(), 'registry/default/blocks/mcp-auth-html')

// The two files a preview must not use as shipped: one points at localhost, the
// other would call a Supabase project that does not exist.
const SUBSTITUTIONS: Record<string, string> = {
  'config.js': PREVIEW_CONFIG,
  'assets/supabase.js': PREVIEW_SUPABASE,
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
}

/**
 * The pages reference their assets relatively (`../assets/styles.css`), which
 * assumes the directory URL they are installed at. Next.js redirects trailing
 * slashes away, so give each page an explicit base to resolve against instead.
 */
function withBaseHref(html: string, segments: string[]) {
  const directory = segments.length ? `${segments.join('/')}/` : ''
  const baseHref = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/example/mcp-auth/${directory}`

  return html.replace('<head>', `<head>\n    <base href="${baseHref}" />`)
}

export async function GET(_request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const segments = (await params).path ?? []

  // Reject anything that could climb out of the block directory before it
  // reaches the filesystem.
  if (segments.some((segment) => segment === '..' || segment.includes('/'))) {
    return new NextResponse('Not found', { status: 404 })
  }

  const requested = segments.join('/')
  // A path without an extension is a directory, and directories serve index.html.
  const filePath = path.extname(requested) ? requested : path.join(requested, 'index.html')

  const substitution = SUBSTITUTIONS[filePath]
  if (substitution) {
    return new NextResponse(substitution, {
      headers: { 'content-type': CONTENT_TYPES['.js'] },
    })
  }

  const absolutePath = path.join(BLOCK_DIR, filePath)
  if (!absolutePath.startsWith(BLOCK_DIR)) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const content = await fs.readFile(absolutePath, 'utf-8')
    const extension = path.extname(absolutePath)

    return new NextResponse(extension === '.html' ? withBaseHref(content, segments) : content, {
      headers: { 'content-type': CONTENT_TYPES[extension] ?? 'text/plain; charset=utf-8' },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
