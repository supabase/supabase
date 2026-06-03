import { getMultipartBoundary, parseMultipartStream } from '@mjackson/multipart-parser'
import { ZipReader, Uint8ArrayReader, Uint8ArrayWriter } from '@zip.js/zip.js'
import { type NextApiRequest, type NextApiResponse } from 'next'
import { Readable } from 'node:stream'

import apiWrapper from '@/lib/api/apiWrapper'
import { getSitesStore } from '@/lib/api/self-hosted/hosting'
import type { SiteFileInput } from '@/lib/api/self-hosted/hosting/types'

// Files are streamed as multipart/form-data, so disable the default body parser.
export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handlerWithErrorCatching(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

/** Extracts a .zip archive into a flat list of files keyed by their archive path. */
async function extractZip(bytes: Uint8Array): Promise<SiteFileInput[]> {
  const reader = new ZipReader(new Uint8ArrayReader(bytes))
  try {
    const entries = await reader.getEntries()
    const files: SiteFileInput[] = []
    for (const entry of entries) {
      if (entry.directory || !entry.getData) continue
      const content = await entry.getData(new Uint8ArrayWriter())
      files.push({ name: entry.filename, content })
    }
    return files
  } finally {
    await reader.close()
  }
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const slugParam = req.query.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  if (!slug) return res.status(404).json({ error: { message: `Missing 'slug' parameter` } })

  const modeParam = req.query.mode
  const mode = Array.isArray(modeParam) ? modeParam[0] : modeParam
  const replace = mode === 'replace'

  const contentType = req.headers['content-type'] ?? ''
  const boundary = getMultipartBoundary(contentType)
  if (!boundary) {
    return res.status(400).json({ error: { message: 'Expected a multipart/form-data body' } })
  }

  const store = getSitesStore()
  const site = await store.getSite(slug)
  if (!site) return res.status(404).json({ error: { message: 'Site not found' } })

  const files: SiteFileInput[] = []
  const stream = Readable.toWeb(req) as ReadableStream<Uint8Array>
  for await (const part of parseMultipartStream(stream, {
    boundary,
    maxFileSize: 100 * 1024 * 1024,
  })) {
    if (!part.isFile) continue
    const filename = part.filename ?? part.name ?? 'index.html'
    if (filename.toLowerCase().endsWith('.zip')) {
      files.push(...(await extractZip(part.bytes)))
    } else {
      files.push({ name: filename, content: part.bytes })
    }
  }

  if (files.length === 0) {
    return res.status(400).json({ error: { message: 'No files provided' } })
  }

  await store.writeFiles(site.docroot, files, { replace })
  return res.status(200).json({ slug: site.slug, files: files.length, replaced: replace })
}
