import { createDefaultSchema, createResponse } from './routes-helper'

describe('testing Generic Routes Utils', () => {
  describe('creating generic responses [createResponse]', () => {
    test('create generic response with all values', () => {
      const response = {
        message: 'Invalid schema',
        statusCode: '400',
        error: 'Invalid schema error message',
      }

      expect(createResponse('Invalid schema', '400', 'Invalid schema error message')).toEqual(
        response
      )
    })

    test('create generic response without status', () => {
      const response = {
        message: 'Invalid schema',
        error: 'Invalid schema error message',
      }

      expect(createResponse('Invalid schema', undefined, 'Invalid schema error message')).toEqual(
        response
      )
    })

    test('create generic response without error', () => {
      const response = {
        message: 'Invalid schema',
        statusCode: '400',
      }

      expect(createResponse('Invalid schema', '400')).toEqual(response)
    })

    test('create generic response only message', () => {
      const response = {
        message: 'Invalid schema',
      }

      expect(createResponse('Invalid schema')).toEqual(response)
    })
  })

  describe('creating generic schema [createDefaultSchema]', () => {
    test('create generic schema without additional properties', () => {
      const successResponseSchema = { generic: 'example', description: 'Successful response' }
      const response = {
        headers: { $ref: 'authSchema#' },
        response: {
          200: successResponseSchema,
          '4xx': { $ref: 'errorSchema#', description: 'Error response' },
          '5xx': { $ref: 'errorSchema#', description: 'Error response' },
        },
      }

      expect(createDefaultSchema(successResponseSchema, {})).toEqual(response)
    })

    test('create generic schema with additional properties', () => {
      const successResponseSchema = { generic: 'example', description: 'Successful response' }
      const additionalProperties = { generic: 'example' }
      const response = {
        headers: {
          $ref: 'authSchema#',
        },
        response: {
          200: successResponseSchema,
          '4xx': { $ref: 'errorSchema#', description: 'Error response' },
          '5xx': { $ref: 'errorSchema#', description: 'Error response' },
        },
        ...additionalProperties,
      }

      expect(createDefaultSchema(successResponseSchema, additionalProperties)).toEqual(response)
    })
  })
})
