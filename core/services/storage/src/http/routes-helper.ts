import { sharedErrorResponseSchemas } from './schemas/error'

type BucketResponseType = { message: string; statusCode?: string; error?: string }
type SchemaObject = Record<string, unknown>

/**
 * Create generic response for all buckets
 * @param message {string} Main message
 * @param status {string=} StatusCode
 * @param error {string=} Error number (presented as a string)
 * @return {BucketResponseType} Object with all paramaters
 */
function createResponse(message: string, status?: string, error?: string): BucketResponseType {
  const response: BucketResponseType = {
    message,
  }

  if (status) {
    response.statusCode = status
  }

  if (error) {
    response.error = error
  }

  return response
}

function createDefaultSchema(
  successResponseSchema: SchemaObject,
  properties: SchemaObject
): SchemaObject {
  return {
    headers: { $ref: 'authSchema#' },
    response: {
      200: { description: 'Successful response', ...successResponseSchema },
      ...sharedErrorResponseSchemas,
    },
    ...properties,
  }
}

export { createDefaultSchema, createResponse }
