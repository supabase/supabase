// ChunkSignatureParser.ts

import { ERRORS } from '@internal/errors'
import { EMPTY_SHA256_HASH } from '@storage/protocols/s3/signature-v4'
import crypto from 'crypto'
import { Transform, TransformCallback, TransformOptions } from 'stream'

type ParserState = 'HEADER' | 'DATA' | 'FOOTER' | 'TRAILER'

const EMPTY_BUFFER = Buffer.alloc(0) as Buffer<ArrayBufferLike>
const CRLF = Buffer.from('\r\n')
const TRAILER_TERMINATOR = Buffer.from('\r\n\r\n')
const CHUNK_SIZE_PATTERN = /^[0-9a-fA-F]+$/

class SegmentedBufferQueue {
  private segments: Buffer[] = []
  private headIndex = 0
  private headOffset = 0
  private totalLength = 0

  get length() {
    return this.totalLength
  }

  append(buffer: Buffer) {
    if (buffer.length === 0) {
      return
    }

    this.segments.push(buffer)
    this.totalLength += buffer.length
  }

  peek(length: number): Buffer {
    if (length === 0) {
      return EMPTY_BUFFER
    }

    if (length > this.totalLength) {
      throw ERRORS.InternalError(undefined, 'Insufficient buffered data')
    }

    const head = this.segments[this.headIndex]
    const availableInHead = head.length - this.headOffset

    if (length <= availableInHead) {
      return head.subarray(this.headOffset, this.headOffset + length)
    }

    const parts: Buffer[] = []
    let remaining = length

    for (let idx = this.headIndex; idx < this.segments.length && remaining > 0; idx++) {
      const segment = this.segments[idx]
      const start = idx === this.headIndex ? this.headOffset : 0
      const take = Math.min(remaining, segment.length - start)

      if (take > 0) {
        parts.push(segment.subarray(start, start + take))
        remaining -= take
      }
    }

    return Buffer.concat(parts, length)
  }

  readUtf8(length: number) {
    return this.peek(length).toString('utf8')
  }

  peekLastByte(): number | undefined {
    if (this.totalLength === 0) {
      return undefined
    }

    for (let idx = this.segments.length - 1; idx >= this.headIndex; idx--) {
      const segment = this.segments[idx]
      const start = idx === this.headIndex ? this.headOffset : 0

      if (segment.length > start) {
        return segment[segment.length - 1]
      }
    }

    return undefined
  }

  consume(length: number, onChunk?: (chunk: Buffer) => void): number {
    const requested = Math.min(length, this.totalLength)
    let remaining = requested

    while (remaining > 0 && this.headIndex < this.segments.length) {
      const head = this.segments[this.headIndex]
      const available = head.length - this.headOffset
      const take = Math.min(remaining, available)
      const piece = head.subarray(this.headOffset, this.headOffset + take)

      onChunk?.(piece)

      this.headOffset += take
      this.totalLength -= take
      remaining -= take

      if (this.headOffset === head.length) {
        this.headIndex += 1
        this.headOffset = 0
      }
    }

    this.compact()
    return requested - remaining
  }

  find(pattern: Buffer, fromOffset = 0): number {
    if (pattern.length === 0) {
      return 0
    }

    if (fromOffset >= this.totalLength) {
      return -1
    }

    let absoluteOffset = 0
    let tail: Buffer<ArrayBufferLike> = EMPTY_BUFFER

    for (let idx = this.headIndex; idx < this.segments.length; idx++) {
      const segment = this.segments[idx]
      const segmentStart = idx === this.headIndex ? this.headOffset : 0
      const segmentLength = segment.length - segmentStart

      if (segmentLength === 0) {
        continue
      }

      if (fromOffset >= absoluteOffset + segmentLength) {
        absoluteOffset += segmentLength
        continue
      }

      const viewStart = segmentStart + Math.max(0, fromOffset - absoluteOffset)
      const view = segment.subarray(viewStart)

      if (tail.length > 0) {
        const boundaryLength = Math.min(pattern.length - 1, view.length)

        if (boundaryLength > 0) {
          const boundary = Buffer.concat(
            [tail, view.subarray(0, boundaryLength)],
            tail.length + boundaryLength
          )
          const boundaryIdx = boundary.indexOf(pattern)

          if (boundaryIdx >= 0) {
            const matchStart = absoluteOffset - tail.length + boundaryIdx
            if (matchStart >= fromOffset) {
              return matchStart
            }
          }
        }
      }

      const innerIdx = view.indexOf(pattern)
      if (innerIdx >= 0) {
        return absoluteOffset + (viewStart - segmentStart) + innerIdx
      }

      const viewTail = view.subarray(Math.max(0, view.length - (pattern.length - 1)))
      const tailSource =
        tail.length === 0
          ? viewTail
          : Buffer.concat([tail, viewTail], tail.length + viewTail.length)
      const tailLength = Math.min(pattern.length - 1, tailSource.length)
      tail = tailLength === 0 ? EMPTY_BUFFER : tailSource.subarray(tailSource.length - tailLength)
      absoluteOffset += segmentLength
    }

    return -1
  }

  private compact() {
    if (this.totalLength === 0) {
      this.segments = []
      this.headIndex = 0
      this.headOffset = 0
      return
    }

    if (this.headIndex > 32 && this.headIndex * 2 >= this.segments.length) {
      this.segments = this.segments.slice(this.headIndex)
      this.headIndex = 0
    }
  }
}

/**
 * Represents the different types of V4 streaming algorithms supported.
 *
 * The `V4StreamingAlgorithm` type defines a series of constants that specify the
 * streaming algorithms used for AWS signature version 4 signing in streaming scenarios.
 * These algorithms dictate the method for signing and authenticating streamed payloads.
 *
 * Available algorithms:
 * - 'STREAMING-UNSIGNED-PAYLOAD-TRAILER': Indicates an unsigned payload with a trailer.
 * - 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD': Indicates AWS signature version 4 with HMAC-SHA256 for streamed payload signing.
 * - 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER': Indicates AWS signature version 4 with HMAC-SHA256 for streamed payload signing, including a trailer.
 */
export type V4StreamingAlgorithm =
  | 'STREAMING-UNSIGNED-PAYLOAD-TRAILER'
  | 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD'
  | 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER'

/**
 * Represents the configuration options for parsing chunk signatures in a
 * streaming operation. This interface extends the TransformOptions interface
 * and adds additional options specific to chunk signature validation and
 * processing.
 *
 * Properties:
 * - `maxHeaderLength` (optional): Specifies the maximum number of bytes allowed
 *   for the header line. Default is 128 bytes.
 * - `signaturePattern` (optional): A regular expression used to validate the
 *   signature for each chunk. The default pattern ensures 64 hexadecimal characters.
 * - `streamingAlgorithm`: Specifies the streaming algorithm to be used. This
 *   property is required.
 * - `trailerHeaderNames` (optional): A list of header names included in the
 *   trailer, as specified in the `x-amz-trailer` header.
 * - `maxChunkSize`: Specifies the maximum allowable size for each chunk. The
 *   default is 8MB.
 */
export interface ChunkSignatureParserOptions extends TransformOptions {
  /** Max bytes of header line; default 128 */
  maxHeaderLength?: number
  /** Regex for validating per-chunk signature; default 64 hex chars */
  signaturePattern?: RegExp
  /** Choose streaming algorithm */
  streamingAlgorithm: V4StreamingAlgorithm
  /** Names of trailer headers as specified in x-amz-trailer */
  trailerHeaderNames?: string[]
  /** Max chunk size; default 8MB */
  maxChunkSize: number
}

/**
 * ChunkSignatureV4Parser is a Transform stream implementation designed to parse and validate
 * chunked data streams with signatures as part of the AWS Signature Version 4 streaming protocol.
 * See: http://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-streaming.html
 *
 * It processes data in sequential phases (HEADER, DATA, FOOTER, TRAILER) and validates the integrity
 * and authenticity of chunked payloads. The parser supports multiple streaming algorithms and verifies
 * chunk signatures when required.
 *
 * A chunk has the following format:
 *
 * <chunk-size-as-hex> + ";chunk-signature=" + <signature-as-hex> + "\r\n" + <payload> + "\r\n"
 *
 */
export class ChunkSignatureV4Parser extends Transform {
  protected readonly buffer = new SegmentedBufferQueue()
  private state: ParserState = 'HEADER'
  private bytesRemaining = 0
  private headerSearchOffset = 0
  private trailerSearchOffset = 0

  private dataRead = 0
  private currentSignature?: string
  private currentChunkSize = 0
  private currentHash?: crypto.Hash
  private previousSignature?: string
  private completedFinalChunk = false

  private readonly maxHeaderLength: number
  private readonly signaturePattern: RegExp
  private readonly alg: V4StreamingAlgorithm

  constructor(private opts: ChunkSignatureParserOptions) {
    super(opts)
    this.validateStreamingAlgorithm(opts.streamingAlgorithm)

    this.maxHeaderLength = opts.maxHeaderLength ?? 128
    this.signaturePattern = opts.signaturePattern ?? /^[0-9a-fA-F]{64}$/
    this.alg = opts.streamingAlgorithm
  }

  _transform(chunk: Buffer | string, encoding: BufferEncoding, cb: TransformCallback) {
    const data = typeof chunk === 'string' ? Buffer.from(chunk, encoding) : chunk
    this.buffer.append(data)

    try {
      let madeProgress: boolean

      do {
        madeProgress = false
        switch (this.state) {
          case 'HEADER':
            madeProgress = this.consumeHeader()
            break
          case 'DATA':
            madeProgress = this.consumeData()
            break
          case 'FOOTER':
            madeProgress = this.consumeFooter()
            break
          case 'TRAILER':
            madeProgress = this.consumeTrailer()
            break
        }
      } while (madeProgress)

      cb()
    } catch (err) {
      const error = err as Error
      // Convert chunk size errors to 400 instead of 500
      if (error.message && error.message.includes('Chunk size exceeds')) {
        const limit = error.message.replace('Chunk size exceeds', '').trim()
        cb(ERRORS.EntityTooLarge(error, 'chunk', limit))
      } else {
        cb(error)
      }
    }
  }

  _flush(callback: TransformCallback) {
    try {
      switch (this.state) {
        case 'HEADER':
          if (this.buffer.length > 0) {
            throw ERRORS.InvalidRequest('Incomplete chunk header')
          }
          if (!this.completedFinalChunk) {
            throw ERRORS.InvalidRequest('Missing final chunk')
          }
          break
        case 'DATA':
          throw ERRORS.InvalidRequest('Unexpected end of chunk data')
        case 'FOOTER':
          throw ERRORS.InvalidRequest('Missing CRLF after chunk data')
        case 'TRAILER':
          throw ERRORS.InvalidRequest('Incomplete trailer section')
      }

      callback()
    } catch (err) {
      callback(err as Error)
    }
  }

  private validateStreamingAlgorithm(alg: string) {
    const validAlgorithms = [
      'STREAMING-UNSIGNED-PAYLOAD-TRAILER',
      'STREAMING-AWS4-HMAC-SHA256-PAYLOAD',
      'STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER',
    ]
    if (!validAlgorithms.includes(alg)) {
      throw ERRORS.InvalidRequest(`Invalid streaming algorithm: ${alg}`)
    }
  }

  /**
   * Extracts size and signature from a header line according to the current algorithm.
   */
  protected parseHeaderLine(line: string): { size: number; signature?: string } {
    const delim = ';chunk-signature='
    let size: number
    let sig: string | undefined

    const signedHeaderParts = line.split(delim)
    if (signedHeaderParts.length === 2) {
      const [sizeHex, signature] = signedHeaderParts
      if (!CHUNK_SIZE_PATTERN.test(sizeHex) || !this.signaturePattern.test(signature)) {
        throw ERRORS.InvalidRequest('Invalid chunk header')
      }
      size = parseInt(sizeHex, 16)
      sig = signature
    } else if (signedHeaderParts.length > 2) {
      throw ERRORS.InvalidRequest('Invalid chunk header')
    } else {
      if (!CHUNK_SIZE_PATTERN.test(line)) {
        throw ERRORS.InvalidRequest('Invalid chunk size')
      }
      size = parseInt(line, 16)
      // signature required for signed algorithms
      if (
        this.alg === 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD' ||
        this.alg === 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER'
      ) {
        throw ERRORS.InvalidSignature('Missing chunk signature')
      }
    }
    return { size, signature: sig }
  }

  private consumeHeader(): boolean {
    if (this.buffer.length === 0) return false

    if (this.completedFinalChunk) {
      throw ERRORS.InvalidRequest('Unexpected data after final chunk')
    }

    const idx = this.buffer.find(CRLF, this.headerSearchOffset)
    if (idx < 0) {
      const effectiveHeaderLength =
        this.buffer.length - (this.buffer.peekLastByte() === CRLF[0] ? 1 : 0)
      if (effectiveHeaderLength > this.maxHeaderLength) {
        throw ERRORS.EntityTooLarge(undefined, 'chunk header', `${this.maxHeaderLength} bytes`)
      }
      this.headerSearchOffset = Math.max(0, this.buffer.length - (CRLF.length - 1))
      return false
    }

    if (idx > this.maxHeaderLength) {
      throw ERRORS.EntityTooLarge(undefined, 'chunk header', `${this.maxHeaderLength} bytes`)
    }

    const line = this.buffer.readUtf8(idx)
    const { size, signature } = this.parseHeaderLine(line)

    if (size > this.opts.maxChunkSize) {
      throw ERRORS.EntityTooLarge(undefined, 'chunk', `${this.opts.maxChunkSize} bytes`)
    }

    this.currentChunkSize = size
    this.currentSignature = signature
    this.bytesRemaining = size
    this.currentHash =
      size > 0 && this.requiresChunkHash() ? crypto.createHash('sha256') : undefined

    this.buffer.consume(idx + CRLF.length)
    this.headerSearchOffset = 0
    this.state = 'DATA'
    return true
  }

  private consumeData(): boolean {
    const want = this.bytesRemaining

    if (want === 0) {
      if (this.hasTrailer()) {
        this.emitCurrentSignatureForVerification()
        this.state = 'TRAILER'
        this.trailerSearchOffset = 0
      } else {
        this.dataRead = 0
        this.state = 'FOOTER'
      }
      return true
    }

    if (this.buffer.length === 0) {
      return false
    }

    const toConsume = Math.min(this.buffer.length, want)

    this.buffer.consume(toConsume, (piece) => {
      this.currentHash?.update(piece)
      this.push(piece)
    })

    this.bytesRemaining -= toConsume
    this.dataRead += toConsume

    if (this.dataRead > this.opts.maxChunkSize) {
      throw ERRORS.EntityTooLarge(undefined, 'chunk', `${this.opts.maxChunkSize} bytes`)
    }

    if (this.bytesRemaining === 0) {
      this.dataRead = 0
      this.state = 'FOOTER'
    }
    return true
  }

  private consumeFooter(): boolean {
    if (this.buffer.length < CRLF.length) return false

    const footer = this.buffer.peek(CRLF.length)
    if (footer[0] !== 0x0d || footer[1] !== 0x0a) {
      throw ERRORS.InvalidRequest('Missing CRLF after chunk data')
    }

    this.emitCurrentSignatureForVerification()
    this.buffer.consume(CRLF.length)
    if (this.currentChunkSize === 0) {
      this.completedFinalChunk = true
    }
    this.state = 'HEADER'
    this.headerSearchOffset = 0
    this.trailerSearchOffset = 0

    return true
  }

  private consumeTrailer(): boolean {
    const dbl = this.buffer.find(TRAILER_TERMINATOR, this.trailerSearchOffset)
    if (dbl < 0) {
      this.trailerSearchOffset = Math.max(0, this.buffer.length - (TRAILER_TERMINATOR.length - 1))
      return false
    }

    const block = this.buffer.readUtf8(dbl)
    this.buffer.consume(dbl + TRAILER_TERMINATOR.length)

    const parsed: Record<string, string> = {}
    block.split('\r\n').forEach((line) => {
      const [k, v] = line.split(/: ?/, 2)
      if (k && v !== undefined) parsed[k.toLowerCase()] = v
    })

    const names = this.opts.trailerHeaderNames || []
    const trailers: Record<string, string> = {}
    names.forEach((n) => {
      const key = n.toLowerCase()
      if (parsed[key] !== undefined) trailers[key] = parsed[key]
    })

    this.emit('trailer', trailers)
    this.completedFinalChunk = true
    this.state = 'HEADER'
    this.headerSearchOffset = 0
    this.trailerSearchOffset = 0

    return true
  }

  private hasTrailer(): boolean {
    return this.alg.endsWith('-TRAILER')
  }

  private requiresChunkHash() {
    return this.alg !== 'STREAMING-UNSIGNED-PAYLOAD-TRAILER'
  }

  private emitCurrentSignatureForVerification() {
    const sig = this.currentSignature
    const size = this.currentChunkSize
    const prev = this.previousSignature
    const hash =
      this.currentHash?.digest('hex') ??
      (size === 0 && this.requiresChunkHash() ? EMPTY_SHA256_HASH : undefined)

    if (hash !== undefined) {
      this.emit('signatureReadyForVerification', sig, size, hash, prev)
      this.previousSignature = sig
    }
  }
}
