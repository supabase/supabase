import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { ensureDir } from '@internal/fs'

export type PprofRequestTargetType = 'heap' | 'heap-snapshot' | 'profile'

const DEFAULT_PPROF_FILENAME = 'profile.pprof.gz'
const DEFAULT_HEAP_SNAPSHOT_FILENAME = 'heap-snapshot.heapsnapshot'

function parseFilename(contentDisposition: string | undefined) {
  if (!contentDisposition) return
  const extended = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (extended) {
    try {
      return decodeURIComponent(extended)
    } catch {}
  }
  return (
    contentDisposition.match(/filename="([^"]+)"/i)?.[1] ??
    contentDisposition.match(/filename=([^;]+)/i)?.[1]?.trim()
  )
}

function sanitizeFilename(filename: string, fallback: string) {
  const sanitized = path.posix.basename(filename.trim().replaceAll('\\', '/'))
  return !sanitized || sanitized === '.' || sanitized === '..' ? fallback : sanitized
}

function getByte(chunk: Buffer | string | Uint8Array, index: number) {
  return typeof chunk === 'string' ? chunk.charCodeAt(index) : chunk[index]
}

function firstNonWhitespace(chunk: Buffer | string | Uint8Array) {
  for (let index = 0; index < chunk.length; index += 1) {
    const byte = getByte(chunk, index)
    if (byte !== 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) return byte
  }
}

function lastNonWhitespace(chunk: Buffer | string | Uint8Array) {
  for (let index = chunk.length - 1; index >= 0; index -= 1) {
    const byte = getByte(chunk, index)
    if (byte !== 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) return byte
  }
}

async function* validateCapture(
  source: AsyncIterable<Buffer | string | Uint8Array>,
  heapSnapshot: boolean
) {
  let bytes = 0
  let first: number | undefined
  let last: number | undefined
  const gzipHeader: number[] = []

  for await (const chunk of source) {
    bytes += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.byteLength
    if (heapSnapshot) {
      first ??= firstNonWhitespace(chunk)
      last = lastNonWhitespace(chunk) ?? last
    } else {
      for (let index = 0; index < chunk.length && gzipHeader.length < 2; index += 1) {
        gzipHeader.push(getByte(chunk, index))
      }
    }
    yield chunk
  }

  if (bytes === 0) throw new Error('Pprof response was empty.')
  if (!heapSnapshot && (gzipHeader[0] !== 0x1f || gzipHeader[1] !== 0x8b)) {
    throw new Error('Pprof response is not gzip data.')
  }
  if (heapSnapshot && (first !== 0x7b || last !== 0x7d)) {
    throw new Error('Heap snapshot response is not a complete JSON object.')
  }
}

export async function writePprofCaptureToFile(
  stream: NodeJS.ReadableStream,
  response: {
    contentDisposition?: string
    type: PprofRequestTargetType
  },
  options?: { outputPath?: string }
) {
  const heapSnapshot = response.type === 'heap-snapshot'
  const fallback = heapSnapshot ? DEFAULT_HEAP_SNAPSHOT_FILENAME : DEFAULT_PPROF_FILENAME
  const filename = sanitizeFilename(
    parseFilename(response.contentDisposition) ?? fallback,
    fallback
  )
  const outputPath = options?.outputPath
    ? path.resolve(options.outputPath)
    : path.resolve(process.cwd(), 'dist', filename)
  const temporaryPath = path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.${process.pid}.${randomUUID()}.tmp`
  )

  await ensureDir(path.dirname(outputPath))
  const output = fs.createWriteStream(temporaryPath, { flags: 'wx' })
  try {
    await pipeline(
      stream as AsyncIterable<Buffer | string | Uint8Array>,
      (source) => validateCapture(source, heapSnapshot),
      output
    )
    await fs.promises.rename(temporaryPath, outputPath)
  } catch (error) {
    output.destroy()
    if (!output.closed) {
      await new Promise<void>((resolve) => output.once('close', resolve))
    }
    await fs.promises.unlink(temporaryPath).catch(() => {})
    throw error
  }
  console.log(`Saved pprof capture to ${outputPath}.`)
  return { outputPath }
}
