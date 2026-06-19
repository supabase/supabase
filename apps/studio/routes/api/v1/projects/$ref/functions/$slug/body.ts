import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import { createFileRoute } from '@tanstack/react-router'

import { getFunctionsArtifactStore } from '@/lib/api/self-hosted/functions'
import { uuidv4 } from '@/lib/helpers'

// Twin of `pages/api/v1/projects/[ref]/functions/[slug]/body.ts`. Web-
// streams rewrite — the pages-router version flushed multipart parts
// directly via Node's `res.write` + `pipeline(createReadStream, res)`,
// which the buffering `toWebHandler` shim can't represent. Returns a
// `Response` whose body is a `ReadableStream`; each file is converted
// via `Readable.toWeb` and pulled chunk-by-chunk into the same stream.
//
// `getFunctionsArtifactStore` already asserts self-hosted mode, so no
// auth wrapper is needed (matches the pages-router `apiWrapper`'s
// effective no-op when `IS_PLATFORM` is false).

const GET = async ({ params }: { params: { ref?: string; slug?: string } }) => {
  const { slug } = params
  if (!slug) {
    return new Response(
      JSON.stringify({ error: { message: `Missing function 'slug' parameter` } }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
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

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            `--${boundary}\r\n` +
              `Content-Disposition: form-data; name="metadata"\r\n` +
              `Content-Type: application/json\r\n` +
              `\r\n` +
              JSON.stringify(metadata) +
              `\r\n`
          )
        )

        for (const entry of fileEntries) {
          const safeName = entry.relativePath
            .replace(/[\r\n]/g, '')
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
          const encodedName = encodeURIComponent(entry.relativePath)
          controller.enqueue(
            encoder.encode(
              `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="file"; filename="${safeName}"; filename*=UTF-8''${encodedName}\r\n` +
                `Content-Type: text/plain\r\n` +
                `\r\n`
            )
          )

          const nodeStream = createReadStream(entry.absolutePath)
          const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>
          const reader = webStream.getReader()
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              if (value) controller.enqueue(value)
            }
          } finally {
            reader.releaseLock()
          }

          controller.enqueue(encoder.encode(`\r\n`))
        }

        controller.enqueue(encoder.encode(`--${boundary}--\r\n`))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
  })
}

export const Route = createFileRoute('/api/v1/projects/$ref/functions/$slug/body')({
  server: {
    handlers: {
      GET,
    },
  },
})
