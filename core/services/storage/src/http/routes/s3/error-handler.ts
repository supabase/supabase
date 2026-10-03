import { S3ServiceException } from '@aws-sdk/client-s3'
import { FastifyError } from '@fastify/error'
import { ErrorCode, StorageBackendError } from '@internal/errors'
import { isDatabaseSlowDownError } from '@internal/errors/database-error'
import { FastifyReply } from 'fastify/types/reply'
import { FastifyRequest } from 'fastify/types/request'

type ValidationIssue = {
  instancePath?: string
  message?: string
}

type S3ErrorDetails = {
  code: string
  message: string
}

function getS3ErrorResource(url: string) {
  return url.split('?')[0].replace('/s3', '').split('/').filter(Boolean).join('/')
}

export function formatS3ErrorResponse(error: S3ErrorDetails, request: Pick<FastifyRequest, 'url'>) {
  return {
    Error: {
      Resource: getS3ErrorResource(request.url),
      Code: error.code,
      Message: error.message,
    },
  }
}

function sendS3Error(
  reply: FastifyReply,
  request: FastifyRequest,
  statusCode: number,
  code: string,
  message: string
) {
  return reply.status(statusCode).send(formatS3ErrorResponse({ code, message }, request))
}

export const s3ErrorHandler = (
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  request.executionError = error
  const validation = getValidationIssues(error)

  if (validation) {
    return sendS3Error(
      reply,
      request,
      400,
      ErrorCode.InvalidRequest,
      formatValidationError(validation).message
    )
  }

  if (error instanceof S3ServiceException) {
    return sendS3Error(
      reply,
      request,
      error.$metadata.httpStatusCode || 500,
      (error as { Code?: string }).Code || ErrorCode.S3Error,
      error.message
    )
  }

  // database error
  if (isDatabaseSlowDownError(error)) {
    return sendS3Error(
      reply,
      request,
      429,
      ErrorCode.SlowDown,
      'Too many connections issued to the database'
    )
  }

  if (error instanceof StorageBackendError) {
    return sendS3Error(reply, request, error.httpStatusCode || 500, error.code, error.message)
  }

  const statusCode =
    'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : undefined

  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return sendS3Error(reply, request, statusCode, ErrorCode.InvalidRequest, error.message)
  }

  return sendS3Error(reply, request, 500, ErrorCode.InternalError, 'Internal Server Error')
}

function isValidationIssueArray(value: unknown): value is ValidationIssue[] {
  return Array.isArray(value) && value.every(isValidationIssue)
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  if (!value || typeof value !== 'object') {
    return false
  }

  const issue = value as ValidationIssue
  return (
    (issue.instancePath === undefined || typeof issue.instancePath === 'string') &&
    (issue.message === undefined || typeof issue.message === 'string')
  )
}

function getValidationIssues(error: FastifyError | Error): ValidationIssue[] | undefined {
  if (!('validation' in error)) {
    return undefined
  }

  const value = error.validation
  return isValidationIssueArray(value) ? value : undefined
}

function formatValidationError(errors: readonly ValidationIssue[]) {
  let text = ''
  const separator = ', '

  for (let i = 0; i !== errors.length; ++i) {
    const e = errors[i]
    const instancePath = (e.instancePath || '').replace(/^\//, '')
    text += instancePath.split('/').join(separator) + ' ' + e.message + separator
  }
  return new Error(text.slice(0, -separator.length))
}
