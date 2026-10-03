import { finished } from 'node:stream/promises'
import { EMPTY_SHA256_HASH, SignatureV4 } from '@storage/protocols/s3/signature-v4'
import {
  ChunkSignatureParserOptions,
  ChunkSignatureV4Parser,
} from '@storage/protocols/s3/signature-v4-stream'
import { Buffer } from 'buffer'
import crypto from 'crypto'
import { vi } from 'vitest'

// Test-only subclasses re-export `protected` members so the suite can exercise
// them without `as unknown as`-style casts. Using the parent classes directly
// elsewhere is unaffected.
class TestChunkParser extends ChunkSignatureV4Parser {
  get testBuffer() {
    return this.buffer
  }
  testParseHeaderLine(line: string) {
    return this.parseHeaderLine(line)
  }
}

class TestSignatureV4 extends SignatureV4 {
  override signingKey(key: string, dateStamp: string, regionName: string, serviceName: string) {
    return super.signingKey(key, dateStamp, regionName, serviceName)
  }
}

function deriveSigningKey(secretKey: string, shortDate: string, region: string, service: string) {
  const dateKey = crypto.createHmac('sha256', `AWS4${secretKey}`).update(shortDate).digest()
  const regionKey = crypto.createHmac('sha256', dateKey).update(region).digest()
  const serviceKey = crypto.createHmac('sha256', regionKey).update(service).digest()
  return crypto.createHmac('sha256', serviceKey).update('aws4_request').digest()
}

function createChunkSignature(
  payload: Buffer | string,
  previousSignature: string,
  options: {
    longDate: string
    shortDate: string
    region: string
    service: string
    secretKey: string
  }
) {
  const buffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload)
  const signingKey = deriveSigningKey(
    options.secretKey,
    options.shortDate,
    options.region,
    options.service
  )
  const hash = crypto.createHash('sha256').update(buffer).digest('hex')
  const scope = `${options.shortDate}/${options.region}/${options.service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256-PAYLOAD',
    options.longDate,
    scope,
    previousSignature,
    EMPTY_SHA256_HASH,
    hash,
  ].join('\n')

  return {
    hash,
    signature: crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex'),
  }
}

async function expectParserError(
  parser: ChunkSignatureV4Parser,
  trigger: () => void,
  expected: RegExp
) {
  const completion = finished(parser, { readable: false }).then(
    () => {
      throw new Error('expected parser to emit error but it finished successfully')
    },
    (err) => err as Error
  )

  trigger()

  const error = await completion

  expect(error.message).toMatch(expected)
}

describe('ChunkSignatureV4Parser', () => {
  const makeParser = (opts: Partial<ChunkSignatureParserOptions> = {}) => {
    const defaultOpts: ChunkSignatureParserOptions = {
      streamingAlgorithm: 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD',
      maxChunkSize: 1024,
      ...opts,
    }
    return new TestChunkParser(defaultOpts)
  }

  test('buffer find handles boundary-spanning delimiters after skipped prefixes', () => {
    const parser = makeParser()
    const queue = parser.testBuffer

    queue.append(Buffer.from('\r'))
    queue.append(Buffer.from('\n'))
    queue.append(Buffer.from('\r'))
    queue.append(Buffer.from('\n'))

    expect(queue.find(Buffer.from('\r\n'), 1)).toBe(2)

    queue.consume(2)

    expect(queue.find(Buffer.from('\r\n'))).toBe(0)
  })

  test('buffer consume returns the actual consumed byte count', () => {
    const parser = makeParser()
    const queue = parser.testBuffer
    const consumed: Buffer[] = []

    queue.append(Buffer.from('ab'))
    queue.append(Buffer.from('cd'))

    const count = queue.consume(10, (chunk: Buffer) => consumed.push(chunk))

    expect(count).toBe(4)
    expect(Buffer.concat(consumed).toString()).toBe('abcd')
    expect(queue.length).toBe(0)
  })

  test('constructor throws on invalid algorithm', () => {
    expect(
      () =>
        new ChunkSignatureV4Parser({
          streamingAlgorithm:
            'INVALID' as unknown as ChunkSignatureParserOptions['streamingAlgorithm'],
          maxChunkSize: 1,
        })
    ).toThrow(/Invalid streaming algorithm/)
  })

  test('parseHeaderLine accepts signed header and rejects malformed signature', () => {
    const parser = makeParser()
    const parse = parser.testParseHeaderLine.bind(parser)
    const validSig = 'a'.repeat(64)
    const { size, signature } = parse(`5;chunk-signature=${validSig}`)
    expect(size).toBe(5)
    expect(signature).toBe(validSig)
    expect(() => parse('5;chunk-signature=xyz')).toThrow(/Invalid chunk header/)
    expect(() => parse(`5;chunk-signature=${validSig};chunk-signature=${validSig}`)).toThrow(
      /Invalid chunk header/
    )
    expect(() => parse(`5;other-extension=value;chunk-signature=${validSig}`)).toThrow(
      /Invalid chunk header/
    )
  })

  test('parseHeaderLine rejects invalid chunk size', () => {
    const parser = makeParser()
    const parse = parser.testParseHeaderLine.bind(parser)
    expect(() => parse('zz;chunk-signature=' + 'a'.repeat(64))).toThrow(/Invalid chunk header/)
    expect(() => parse('zz')).toThrow(/Invalid chunk size/)
    expect(() => parse('5zz')).toThrow(/Invalid chunk size/)
  })

  test('missing signature for signed algorithm emits error', async () => {
    const parser = makeParser({ maxChunkSize: 10 })
    await expectParserError(
      parser,
      () => {
        parser.end('5\r\n')
      },
      /Missing chunk signature/
    )
  })

  test('header exceeding maxHeaderLength emits error', async () => {
    const parser = makeParser({ maxHeaderLength: 2 })
    await expectParserError(
      parser,
      () => {
        parser.end('abc')
      },
      /header exceeded 2 bytes/
    )
  })

  test('header exceeding maxHeaderLength still emits error after CRLF arrives', async () => {
    const parser = makeParser({ maxHeaderLength: 2 })
    await expectParserError(
      parser,
      () => {
        parser.end('abc\r\n')
      },
      /header exceeded 2 bytes/
    )
  })

  test('header at maxHeaderLength accepts a fragmented CRLF delimiter', async () => {
    const sig = 'a'.repeat(64)
    const parser = makeParser({ maxHeaderLength: 82, maxChunkSize: 10 })
    const dataChunks: Buffer[] = []
    const sigEvents: Array<{ sig: string; size: number; hash: string; prev: string | undefined }> =
      []

    parser.on('data', (chunk: Buffer) => dataChunks.push(chunk))
    parser.on('signatureReadyForVerification', (sigVal, size, hash, prev) => {
      sigEvents.push({ sig: sigVal, size, hash, prev })
    })

    const endPromise = new Promise<void>((resolve, reject) => {
      parser.on('end', resolve)
      parser.on('error', reject)
    })

    parser.write(`1;chunk-signature=${sig}\r`)
    parser.write('\na\r')
    parser.write('\n')
    parser.end(`0;chunk-signature=${sig}\r\n\r\n`)

    await endPromise

    expect(Buffer.concat(dataChunks).toString()).toBe('a')
    expect(sigEvents).toHaveLength(2)
    expect(sigEvents[0].sig).toBe(sig)
    expect(sigEvents[1]).toEqual({
      sig,
      size: 0,
      hash: EMPTY_SHA256_HASH,
      prev: sig,
    })
  })

  test('terminal chunk still requires the trailing CRLF after its header', async () => {
    const sig = '0'.repeat(64)
    const parser = makeParser({ maxChunkSize: 10 })
    await expectParserError(
      parser,
      () => {
        parser.write(`1;chunk-signature=${sig}\r\n`)
        parser.write('a\r\n')
        parser.end(`0;chunk-signature=${sig}\r\n`)
      },
      /Missing CRLF after chunk data/
    )
  })

  test('errors when the stream ends before the terminal zero-length chunk', async () => {
    const sig = '0'.repeat(64)
    const parser = makeParser({ maxChunkSize: 10 })
    await expectParserError(
      parser,
      () => {
        parser.write(`1;chunk-signature=${sig}\r\n`)
        parser.end('a\r\n')
      },
      /Missing final chunk/
    )
  })

  test('errors when a signed stream ends without any chunks', async () => {
    const parser = makeParser({ maxChunkSize: 10 })
    await expectParserError(
      parser,
      () => {
        parser.end('')
      },
      /Missing final chunk/
    )
  })

  test('chunk size exceeds maxChunkSize emits error', async () => {
    const parser = makeParser({ maxChunkSize: 1 })
    const sig = 'f'.repeat(64)
    await expectParserError(
      parser,
      () => {
        parser.end(`2;chunk-signature=${sig}\r\n`)
      },
      /^The chunk exceeded 1 bytes$/
    )
  })

  test('missing CRLF after chunk data emits error', async () => {
    const sig = '0'.repeat(64)
    const parser = makeParser({ maxChunkSize: 10 })
    await expectParserError(
      parser,
      () => {
        parser.write(`1;chunk-signature=${sig}\r\n`)
        parser.write('a')
        // write invalid footer prefix to trigger error
        parser.end('xx')
      },
      /Missing CRLF after chunk data/
    )
  })

  test('emits signatureReadyForVerification and data for single signed chunk', async () => {
    const sig = '0'.repeat(64)
    const parser = makeParser({ maxChunkSize: 10 })
    const dataChunks: Buffer[] = []
    const sigEvents: Array<{ sig: string; size: number; hash: string; prev: string | undefined }> =
      []

    parser.on('data', (chunk: Buffer) => dataChunks.push(chunk))
    parser.on('signatureReadyForVerification', (sigVal, size, hash, prev) => {
      sigEvents.push({ sig: sigVal, size, hash, prev })
    })

    const header = `5;chunk-signature=${sig}\r\n`
    const payload = 'hello'
    const footer = '\r\n'
    const endChunk = `0;chunk-signature=${sig}\r\n\r\n`
    const endPromise = new Promise<void>((resolve, reject) => {
      parser.on('end', resolve)
      parser.on('error', reject)
    })

    parser.end(header + payload + footer + endChunk)

    await endPromise

    expect(Buffer.concat(dataChunks).toString()).toBe('hello')
    expect(sigEvents).toHaveLength(2)
    expect(sigEvents[0].size).toBe(5)
    const expectedHash = crypto.createHash('sha256').update(payload).digest('hex')
    expect(sigEvents[0].hash).toBe(expectedHash)
    expect(sigEvents[0].sig).toBe(sig)
    expect(sigEvents[0].prev).toBeUndefined()
    expect(sigEvents[1]).toEqual({
      sig,
      size: 0,
      hash: EMPTY_SHA256_HASH,
      prev: sig,
    })
  })

  test('emits signatureReadyForVerification for the zero-length terminal signed chunk', async () => {
    const options = {
      longDate: '20260406T120000Z',
      shortDate: '20260406',
      region: 'us-east-1',
      service: 's3',
      secretKey: 'secret-key',
    }
    const initialSignature = '0'.repeat(64)
    const parser = makeParser({ maxChunkSize: 10 })
    const dataChunks: Buffer[] = []
    const sigEvents: Array<{ sig: string; size: number; hash: string; prev: string | undefined }> =
      []
    const firstChunk = createChunkSignature(Buffer.from('hello'), initialSignature, options)
    const terminalChunk = createChunkSignature(Buffer.alloc(0), firstChunk.signature, options)

    parser.on('data', (chunk: Buffer) => dataChunks.push(chunk))
    parser.on('signatureReadyForVerification', (sigVal, size, hash, prev) => {
      sigEvents.push({ sig: sigVal, size, hash, prev })
    })

    const endPromise = new Promise<void>((resolve, reject) => {
      parser.on('end', resolve)
      parser.on('error', reject)
    })

    parser.end(
      `5;chunk-signature=${firstChunk.signature}\r\nhello\r\n0;chunk-signature=${terminalChunk.signature}\r\n\r\n`
    )

    await endPromise

    expect(Buffer.concat(dataChunks).toString()).toBe('hello')
    expect(sigEvents).toHaveLength(2)
    expect(sigEvents[1]).toEqual({
      sig: terminalChunk.signature,
      size: 0,
      hash: EMPTY_SHA256_HASH,
      prev: firstChunk.signature,
    })
  })

  test('parses fragmented signed chunks without reassembling the unread payload', async () => {
    const sig = '1'.repeat(64)
    const parser = makeParser({ maxChunkSize: 10 })
    const dataChunks: Buffer[] = []
    const sigEvents: Array<{ sig: string; size: number; hash: string; prev: string | undefined }> =
      []

    parser.on('data', (chunk: Buffer) => dataChunks.push(chunk))
    parser.on('signatureReadyForVerification', (sigVal, size, hash, prev) => {
      sigEvents.push({ sig: sigVal, size, hash, prev })
    })

    const endPromise = new Promise<void>((resolve, reject) => {
      parser.on('end', resolve)
      parser.on('error', reject)
    })

    parser.write(`5;chunk-signature=${sig}\r`)
    parser.write('\nhe')
    parser.write(Buffer.from('ll'))
    parser.write('o')
    parser.write('\r')
    parser.write('\n0;chunk-signature=')
    parser.write(sig.slice(0, 20))
    parser.write(sig.slice(20))
    parser.write('\r')
    parser.write('\n')
    parser.end('\r\n')

    await endPromise

    expect(Buffer.concat(dataChunks).toString()).toBe('hello')
    expect(sigEvents).toHaveLength(2)
    expect(sigEvents[0].size).toBe(5)
    expect(sigEvents[0].hash).toBe(crypto.createHash('sha256').update('hello').digest('hex'))
    expect(sigEvents[0].sig).toBe(sig)
    expect(sigEvents[1]).toEqual({
      sig,
      size: 0,
      hash: EMPTY_SHA256_HASH,
      prev: sig,
    })
  })

  test('signed trailer mode verifies the zero-length terminal chunk before trailers', async () => {
    const trailerKey = 'x-amz-meta-foo'
    const options = {
      longDate: '20260406T120000Z',
      shortDate: '20260406',
      region: 'us-east-1',
      service: 's3',
      secretKey: 'secret-key',
    }
    const initialSignature = '1'.repeat(64)
    const parser = new ChunkSignatureV4Parser({
      streamingAlgorithm: 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD-TRAILER',
      maxChunkSize: 1024,
      trailerHeaderNames: [trailerKey],
    })
    const dataChunks: Buffer[] = []
    const sigEvents: Array<{ sig: string; size: number; hash: string; prev: string | undefined }> =
      []
    let trailerObj: Record<string, string> | undefined
    const firstChunk = createChunkSignature(Buffer.from('hello'), initialSignature, options)
    const terminalChunk = createChunkSignature(Buffer.alloc(0), firstChunk.signature, options)

    parser.on('data', (chunk: Buffer) => dataChunks.push(chunk))
    parser.on('signatureReadyForVerification', (sigVal, size, hash, prev) => {
      sigEvents.push({ sig: sigVal, size, hash, prev })
    })
    parser.on('trailer', (trailer) => {
      trailerObj = trailer
    })

    const endPromise = new Promise<void>((resolve, reject) => {
      parser.on('end', resolve)
      parser.on('error', reject)
    })

    parser.end(
      `5;chunk-signature=${firstChunk.signature}\r\nhello\r\n0;chunk-signature=${terminalChunk.signature}\r\n${trailerKey}: bar\r\n\r\n`
    )

    await endPromise

    expect(Buffer.concat(dataChunks).toString()).toBe('hello')
    expect(sigEvents).toHaveLength(2)
    expect(sigEvents[1]).toEqual({
      sig: terminalChunk.signature,
      size: 0,
      hash: EMPTY_SHA256_HASH,
      prev: firstChunk.signature,
    })
    expect(trailerObj).toEqual({ [trailerKey]: 'bar' })
  })

  test('supports unsigned payload algorithm and emits trailer', () => {
    const trailerKey = 'x-amz-meta-foo'
    const trailerValue = 'bar'
    const opts: ChunkSignatureParserOptions = {
      streamingAlgorithm: 'STREAMING-UNSIGNED-PAYLOAD-TRAILER',
      maxChunkSize: 1024,
      trailerHeaderNames: [trailerKey],
    }
    const parser = new ChunkSignatureV4Parser(opts)
    const dataChunks: Buffer[] = []
    let trailerObj: Record<string, string> | undefined

    parser.on('data', (chunk: Buffer) => dataChunks.push(chunk))
    parser.on('trailer', (t) => {
      trailerObj = t
    })

    const header = `3\r\n`
    const payload = 'hey'
    const footer = '\r\n'
    const endChunk = `0\r\n`
    const trailerBlock = `${trailerKey}: ${trailerValue}\r\nother: ignore\r\n\r\n`

    parser.end(header + payload + footer + endChunk + trailerBlock)

    return new Promise<void>((resolve) => {
      parser.on('end', () => {
        expect(Buffer.concat(dataChunks).toString()).toBe('hey')
        expect(trailerObj).toEqual({ [trailerKey]: trailerValue })
        resolve()
      })
    })
  })

  test('supports fragmented unsigned trailers when the terminator spans writes', async () => {
    const trailerKey = 'x-amz-meta-foo'
    const parser = new ChunkSignatureV4Parser({
      streamingAlgorithm: 'STREAMING-UNSIGNED-PAYLOAD-TRAILER',
      maxChunkSize: 1024,
      trailerHeaderNames: [trailerKey],
    })
    const dataChunks: Buffer[] = []
    let trailerObj: Record<string, string> | undefined

    parser.on('data', (chunk: Buffer) => dataChunks.push(chunk))
    parser.on('trailer', (trailer) => {
      trailerObj = trailer
    })

    const endPromise = new Promise<void>((resolve, reject) => {
      parser.on('end', resolve)
      parser.on('error', reject)
    })

    parser.write('3\r\n')
    parser.write('hey\r\n0\r\n')
    parser.write(`${trailerKey}: bar\r\nother: ignore\r`)
    parser.write('\n\r')
    parser.end('\n')

    await endPromise

    expect(Buffer.concat(dataChunks).toString()).toBe('hey')
    expect(trailerObj).toEqual({ [trailerKey]: 'bar' })
  })

  test('dataRead exceeding maxChunkSize emits error', async () => {
    const sig = 'a'.repeat(64)
    const parser = makeParser({ maxChunkSize: 1 })
    await expectParserError(
      parser,
      () => {
        parser.write(`2;chunk-signature=${sig}\r\n`)
        parser.end('ab')
      },
      /^The chunk exceeded 1 bytes$/
    )
  })

  test('honors custom signaturePattern', () => {
    const parser = makeParser({
      streamingAlgorithm: 'STREAMING-AWS4-HMAC-SHA256-PAYLOAD',
      maxChunkSize: 10,
      signaturePattern: /^[0-9]+$/,
    })
    const parse = parser.testParseHeaderLine.bind(parser)
    expect(parse('3;chunk-signature=123').signature).toBe('123')
    expect(() => parse('3;chunk-signature=abc')).toThrow()
  })

  test('reuses the derived signing key across chunk validations in the same scope', () => {
    const secretKey = 'secret-key'
    const signer = new TestSignatureV4({
      enforceRegion: false,
      credentials: {
        accessKey: 'access-key',
        secretKey,
        region: 'us-east-1',
        service: 's3',
      },
    })
    const clientSignature = {
      credentials: {
        accessKey: 'access-key',
        shortDate: '20260406',
        region: 'us-east-1',
        service: 's3',
      },
      signature: 'f'.repeat(64),
      signedHeaders: ['host'],
      longDate: '20260406T120000Z',
    }
    const signingKeySpy = vi.spyOn(signer, 'signingKey')
    const firstChunk = createChunkSignature(Buffer.from('hello'), clientSignature.signature, {
      longDate: clientSignature.longDate,
      shortDate: clientSignature.credentials.shortDate,
      region: clientSignature.credentials.region,
      service: clientSignature.credentials.service,
      secretKey,
    })
    const secondChunk = createChunkSignature(Buffer.from('world'), firstChunk.signature, {
      longDate: clientSignature.longDate,
      shortDate: clientSignature.credentials.shortDate,
      region: clientSignature.credentials.region,
      service: clientSignature.credentials.service,
      secretKey,
    })

    expect(
      signer.validateChunkSignature(
        clientSignature,
        firstChunk.hash,
        firstChunk.signature,
        clientSignature.signature
      )
    ).toBe(true)
    expect(
      signer.validateChunkSignature(
        clientSignature,
        secondChunk.hash,
        secondChunk.signature,
        firstChunk.signature
      )
    ).toBe(true)
    expect(signingKeySpy).toHaveBeenCalledTimes(1)
  })

  test.each([
    { name: 'date', changedScope: { shortDate: '20260407' } },
    { name: 'region', changedScope: { region: 'eu-west-1' } },
    { name: 'service', changedScope: { service: 's3vectors' } },
  ])('validates chunks after the signing $name changes and changes back', ({ changedScope }) => {
    const secretKey = 'secret-key'
    const initialScope = { shortDate: '20260406', region: 'us-east-1', service: 's3' }
    const signer = new TestSignatureV4({
      enforceRegion: false,
      credentials: {
        accessKey: 'access-key',
        secretKey,
        region: initialScope.region,
        service: initialScope.service,
      },
    })
    const signingKeySpy = vi.spyOn(signer, 'signingKey')

    for (const scope of [initialScope, { ...initialScope, ...changedScope }, initialScope]) {
      const clientSignature = {
        credentials: { accessKey: 'access-key', ...scope },
        signature: 'f'.repeat(64),
        signedHeaders: ['host'],
        longDate: `${scope.shortDate}T120000Z`,
      }
      for (const payload of ['first-chunk', 'second-chunk']) {
        const chunk = createChunkSignature(payload, clientSignature.signature, {
          ...scope,
          secretKey,
          longDate: clientSignature.longDate,
        })

        expect(signer.validateChunkSignature(clientSignature, chunk.hash, chunk.signature)).toBe(
          true
        )
      }
    }
    expect(signingKeySpy).toHaveBeenCalledTimes(3)
  })

  test('rejects a wrong-length chunk signature instead of throwing', () => {
    const secretKey = 'secret-key'
    const signer = new TestSignatureV4({
      enforceRegion: false,
      credentials: {
        accessKey: 'access-key',
        secretKey,
        region: 'us-east-1',
        service: 's3',
      },
    })
    const clientSignature = {
      credentials: {
        accessKey: 'access-key',
        shortDate: '20260406',
        region: 'us-east-1',
        service: 's3',
      },
      signature: 'f'.repeat(64),
      signedHeaders: ['host'],
      longDate: '20260406T120000Z',
    }

    expect(
      signer.validateChunkSignature(
        clientSignature,
        'a'.repeat(64),
        'abc',
        clientSignature.signature
      )
    ).toBe(false)
  })
})
