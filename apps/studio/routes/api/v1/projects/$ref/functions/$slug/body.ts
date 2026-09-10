import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import * as Sentry from '@sentry/nextjs'
import { createFileRoute } from '@tanstack/react-router'

import { getFunctionsArtifactStore } from '@/lib/api/self-hosted/functions'
import { uuidv4 } from '@/lib/helpers'

// Twin of `pages/api/v1/projects/[ref]/functions/[slug]/body.ts`. Web-
// streams rewrite — the pages-router version flushed multipart parts
// directly via Node's `res.write` + `pipeline(createReadStream, res)`,
// which the buffering `toWebHandler` shim can't represent. Returns a
// `Response` whose body is a `ReadableStream` built from an async
// generator (`Readable.from(...).toWeb()`), so file reads honour
// consumer backpressure and stop on client disconnect rather than
// buffering every file eagerly.
//
// `getFunctionsArtifactStore` already asserts self-hosted mode, so no
// auth wrapper is needed (matches the pages-router `apiWrapper`'s
// effective no-op when `IS_PLATFORM` is false).

const GET = async ({ params }: { params: { ref?: string; slug?: string } }) => {
  // Mirrors `apiWrapper`'s global catch (lib/api/apiWrapper.ts): capture to
  // Sentry and return a 500 error body. Only errors thrown before the
  // stream `Response` is returned are catchable here — a failure mid-stream
  // (e.g. a file read) can't roll back an already-sent 200 and is left to the
  // stream's own error propagation, which destroys the response.
  try {
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

    // An async generator lets `Readable.from` drive the file reads on demand:
    // it pauses the generator when the consumer is slow (backpressure) and runs
    // the generator's cleanup (closing the file handle) if the stream is
    // destroyed on client disconnect — neither of which an eager
    // `ReadableStream.start()` loop does.
    async function* multipartBody() {
      yield encoder.encode(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="metadata"\r\n` +
          `Content-Type: application/json\r\n` +
          `\r\n` +
          JSON.stringify(metadata) +
          `\r\n`
      )

      for (const entry of fileEntries) {
        const safeName = entry.relativePath
          .replace(/[\r\n]/g, '')
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
        const encodedName = encodeURIComponent(entry.relativePath)
        yield encoder.encode(
          `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="${safeName}"; filename*=UTF-8''${encodedName}\r\n` +
            `Content-Type: text/plain\r\n` +
            `\r\n`
        )

        for await (const chunk of createReadStream(entry.absolutePath)) {
          yield chunk as Uint8Array
        }

        yield encoder.encode(`\r\n`)
      }

      yield encoder.encode(`--${boundary}--\r\n`)
    }

    const stream = Readable.toWeb(
      Readable.from(multipartBody(), { objectMode: false })
    ) as ReadableStream<Uint8Array>

    return new Response(stream, {
      status: 200,
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    })
  } catch (error) {
    Sentry.captureException(error)
    // Generic message only — echoing the caught error can leak stack/internal
    // details to the client (CodeQL js/stack-trace-exposure).
    return new Response(JSON.stringify({ error: { message: 'Internal Server Error' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const Route = createFileRoute('/api/v1/projects/$ref/functions/$slug/body')({
  server: {
    handlers: {
      GET,
    },
  },
})
