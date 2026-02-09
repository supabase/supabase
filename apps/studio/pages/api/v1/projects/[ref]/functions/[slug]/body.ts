import { createReadStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { type NextApiRequest, type NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getFunctionsArtifactStore } from '@/lib/api/self-hosted/functions'
import { uuidv4 } from '@/lib/helpers'

export default function handlerWithErrorCatching(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const slugParam = req.query.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  if (!slug) {
    res.status(404).json({ error: { message: `Missing function 'slug' parameter` } })
    return
  }

  const store = getFunctionsArtifactStore()
  const fileEntries = await store.getFileEntriesBySlug(slug)

  const boundary = `----FormBoundary${uuidv4().replace(/-/g, '')}`
  const totalSize = fileEntries.reduce((sum, entry) => sum + entry.size, 0)

  const metadata = {
    // mock id, should be "<project_id>_<function_id>_<version>"
    deployment_id: uuidv4(),
    original_size: totalSize,
    compressed_size: totalSize,
    module_count: fileEntries.length,
  }

  res.setHeader('Content-Type', `multipart/form-data; boundary=${boundary}`)
  res.status(200)

  // Write metadata part
  const metadataJson = JSON.stringify(metadata)
  res.write(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="metadata"\r\n` +
      `Content-Type: application/json\r\n` +
      `\r\n` +
      metadataJson +
      `\r\n`
  )

  // Stream each file part
  for (const entry of fileEntries) {
    const safeName = entry.relativePath
      .replace(/[\r\n]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
    const encodedName = encodeURIComponent(entry.relativePath)
    res.write(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${safeName}"; filename*=UTF-8''${encodedName}\r\n` +
        `Content-Type: text/plain\r\n` +
        `\r\n`
    )
    await pipeline(createReadStream(entry.absolutePath), res, { end: false })
    res.write(`\r\n`)
  }

  // Write closing boundary
  res.write(`--${boundary}--\r\n`)
  res.end()
}
