import { DashboardModel, MODEL_LIMITS, modelSchema } from './model.schema'

export async function readBoundedStream(
  stream: ReadableStream<Uint8Array>,
  limit: number,
  signal?: AbortSignal
) {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  const handleAbort = () => {
    void reader.cancel().catch(() => undefined)
  }
  signal?.addEventListener('abort', handleAbort, { once: true })
  try {
    signal?.throwIfAborted()
    while (true) {
      const { done, value } = await reader.read()
      signal?.throwIfAborted()
      if (done) break
      length += value.byteLength
      if (length > limit) throw new Error('Dashboard exceeds the decompressed size limit.')
      chunks.push(value)
    }
    const result = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.byteLength
    }
    return result
  } finally {
    signal?.removeEventListener('abort', handleAbort)
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

export async function decodeModel(
  hash: string,
  signal?: AbortSignal
): Promise<DashboardModel | null> {
  if (hash === '' || hash === '#') return null
  if (!hash.startsWith('#v1='))
    throw new Error('Unsupported dashboard link version. Generate a v1 link.')
  const encoded = hash.slice(4)
  if (encoded.length > MODEL_LIMITS.encodedCharacters)
    throw new Error('Dashboard link exceeds the size limit.')
  if (!/^[A-Za-z0-9_-]+$/.test(encoded))
    throw new Error('Dashboard link contains invalid data. Generate a new link.')
  if (typeof DecompressionStream === 'undefined')
    throw new Error(
      'This browser cannot open compressed dashboard links. Use a browser with gzip decompression support.'
    )
  let parsed: unknown
  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
    const decompressed = await readBoundedStream(stream, MODEL_LIMITS.decompressedBytes, signal)
    parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decompressed))
  } catch (error) {
    signal?.throwIfAborted()
    if (error instanceof Error && error.message.includes('size limit')) throw error
    throw new Error('Dashboard link could not be decoded. Generate a new link.')
  }
  const result = modelSchema.safeParse(parsed)
  if (!result.success) throw new Error(`Invalid dashboard: ${result.error.issues[0].message}`)
  return result.data
}

export async function encodeModel(model: DashboardModel): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(modelSchema.parse(model)))
  if (json.byteLength > MODEL_LIMITS.decompressedBytes)
    throw new Error('Dashboard exceeds the decompressed size limit.')
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))
  const compressed = await readBoundedStream(stream, MODEL_LIMITS.encodedCharacters)
  const encoded = btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  if (encoded.length > MODEL_LIMITS.encodedCharacters)
    throw new Error('Dashboard link exceeds the size limit.')
  return `#v1=${encoded}`
}
