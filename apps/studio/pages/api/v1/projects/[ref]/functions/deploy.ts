import { Readable } from 'node:stream'
import { getMultipartBoundary, parseMultipartStream } from '@mjackson/multipart-parser'
import type { components } from 'api-types'
import { type NextApiRequest, type NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getFunctionsArtifactStore } from '@/lib/api/self-hosted/functions'
import { getStableFunctionId } from '@/lib/api/self-hosted/functions/fileSystemStore'

// The deploy request is sent as multipart/form-data, so disable Next.js' default
// body parser and stream the request straight into the multipart parser.
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

type EdgeFunctionsResponse = components['schemas']['FunctionResponse']

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const slugParam = req.query.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  if (!slug) {
    return res.status(400).json({ error: { message: `Missing function 'slug' parameter` } })
  }

  const contentType = req.headers['content-type'] ?? ''
  const boundary = getMultipartBoundary(contentType)
  if (!boundary) {
    return res
      .status(400)
      .json({ error: { message: 'Expected a multipart/form-data request body' } })
  }

  const files: Array<{ name: string; content: string }> = []
  let metadata: { name?: string } = {}

  const stream = Readable.toWeb(req) as ReadableStream<Uint8Array>
  for await (const part of parseMultipartStream(stream, {
    boundary,
    maxFileSize: 20 * 1024 * 1024,
  })) {
    if (part.isFile) {
      files.push({ name: part.filename ?? part.name ?? 'index.ts', content: part.text })
    } else if (part.name === 'metadata') {
      try {
        metadata = JSON.parse(part.text)
      } catch {
        // Ignore malformed metadata; the files are what matter for self-hosted deploys.
      }
    }
  }

  if (files.length === 0) {
    return res.status(400).json({ error: { message: 'No files provided for deployment' } })
  }

  const store = getFunctionsArtifactStore()
  const artifact = await store.deployFunction(slug, files)

  const functionResponse = {
    id: getStableFunctionId(artifact.slug),
    slug: artifact.slug,
    version: 1,
    name: metadata.name ?? artifact.slug,
    status: 'ACTIVE',
    entrypoint_path: artifact.entrypoint_path,
    created_at: artifact.created_at,
    updated_at: artifact.updated_at,
  } satisfies EdgeFunctionsResponse

  return res.status(201).json(functionResponse)
}
