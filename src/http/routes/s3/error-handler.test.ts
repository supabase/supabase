import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { Readable } from 'node:stream'
import { GetObjectCommand, S3Client, S3ServiceException } from '@aws-sdk/client-s3'
import { ERRORS, ErrorCode } from '@internal/errors'
import { DBError } from '@storage/database/errors'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { DatabaseError } from 'pg'
import { vi } from 'vitest'
import { formatS3ErrorResponse, s3ErrorHandler } from './error-handler'

describe('formatS3ErrorResponse resource normalization', () => {
  it.each([
    ['strips the S3 route prefix', '/s3/public/object', 'public/object'],
    ['drops the query string', '/s3/public/object?uploads', 'public/object'],
    ['preserves nested s3 segments', '/s3/bucket/s3/key', 'bucket/s3/key'],
    ['normalizes a trailing slash', '/s3/public/object/', 'public/object'],
    ['returns an empty resource for the root path', '/s3', ''],
    ['returns an empty resource for the slash root path', '/s3/', ''],
    ['returns an empty resource for an empty URL', '', ''],
  ])('%s', (_case, url, expected) => {
    expect(
      formatS3ErrorResponse({ code: 'TestError', message: 'test error' }, { url }).Error.Resource
    ).toBe(expected)
  })
})

describe('s3ErrorHandler', () => {
  it.each([
    [
      'the upstream XML code',
      412,
      '<Error><Code>PreconditionFailed</Code><Message>ETag changed</Message></Error>',
      'PreconditionFailed',
      'ETag changed',
    ],
    ['S3Error when the upstream response has no XML code', 403, '', 'S3Error', 'UnknownError'],
  ])('reports %s for an S3 SDK error', async (_name, statusCode, body, Code, Message) => {
    const client = new S3Client({
      region: 'us-east-1',
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
      requestHandler: {
        handle: async () => ({
          response: {
            statusCode,
            headers: { 'content-type': 'application/xml' },
            body: Readable.from(body ? [body] : []),
          },
        }),
      },
    })
    const request = createRequest('/s3/public/object')
    const reply = createReply(request)

    try {
      const error = await client
        .send(new GetObjectCommand({ Bucket: 'public', Key: 'object', IfMatch: '"stale"' }))
        .catch((error: unknown) => error)
      expect(error).toBeInstanceOf(S3ServiceException)
      s3ErrorHandler(error as S3ServiceException, request, reply)

      expect(reply.status).toHaveBeenCalledWith(statusCode)
      expect(reply.send).toHaveBeenCalledWith({
        Error: { Resource: 'public/object', Code, Message },
      })
    } finally {
      client.destroy()
      request.raw.destroy()
    }
  })

  it('retains explicit-close errors for the response hook', () => {
    const request = createRequest('/s3/public/object')
    const reply = createReply(request)
    const error = ERRORS.InvalidRequest('rejected').withConnectionClose()

    try {
      s3ErrorHandler(error, request, reply)
      expect(request.executionError).toBe(error)
      expect(reply.status).toHaveBeenCalledWith(400)
    } finally {
      request.raw.destroy()
    }
  })

  it('maps wrapped database slowdown errors to 429', () => {
    const request = createRequest('/s3/public/object')
    const reply = createReply(request)

    s3ErrorHandler(
      DBError.fromDBError(createPgError('08P01', 'no more connections allowed (max_client_conn)')),
      request,
      reply
    )

    expect(reply.status).toHaveBeenCalledWith(429)
    expect(reply.send).toHaveBeenCalledWith({
      Error: {
        Resource: 'public/object',
        Code: ErrorCode.SlowDown,
        Message: 'Too many connections issued to the database',
      },
    })
  })

  it('keeps wrapped non-slowdown connection errors as database errors', () => {
    const request = createRequest('/s3/public/object')
    const reply = createReply(request)

    s3ErrorHandler(
      DBError.fromDBError(createPgError('08P01', 'received invalid response: 58')),
      request,
      reply
    )

    expect(reply.status).toHaveBeenCalledWith(500)
    expect(reply.send).toHaveBeenCalledWith({
      Error: {
        Resource: 'public/object',
        Code: ErrorCode.DatabaseError,
        Message: 'database error, code: 08P01',
      },
    })
  })
})

function createPgError(code: string, message: string): DatabaseError {
  const error = new DatabaseError(message, message.length, 'error')
  error.code = code
  return error
}

function createRequest(url: string): FastifyRequest {
  return { url, raw: new IncomingMessage(new Socket()) } as FastifyRequest
}

function createReply(request: FastifyRequest): FastifyReply {
  const reply = {
    raw: new ServerResponse(request.raw),
    status: vi.fn(),
    send: vi.fn(),
  }
  reply.status.mockReturnValue(reply)
  reply.send.mockReturnValue(reply)
  return reply as unknown as FastifyReply
}
