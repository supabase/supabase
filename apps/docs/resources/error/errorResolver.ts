import * as Sentry from '@sentry/nextjs'
import { GraphQLError, GraphQLNonNull, GraphQLResolveInfo, GraphQLString } from 'graphql'
import type {
  ErrorCollection,
  RootQueryTypeErrorArgs,
  RootQueryTypeErrorsArgs,
  Service,
} from '~/__generated__/graphql'
import { ApiError, convertUnknownToApiError, extractMessageFromAnyError } from '~/app/api/utils'
import { Result } from '~/features/helpers.fn'
import {
  createCollectionType,
  GraphQLCollectionBuilder,
  paginationArgs,
  type CollectionFetch,
} from '../utils/connections'
import { ErrorModel } from './errorModel'
import {
  GRAPHQL_FIELD_ERROR_GLOBAL,
  GRAPHQL_FIELD_ERRORS_GLOBAL,
  GraphQLEnumTypeService,
  GraphQLObjectTypeError,
} from './errorSchema'

/**
 * Encodes a string to base64
 */
function encodeBase64(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64')
}

/**
 * Decodes a base64 string back to the original string
 */
function decodeBase64(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf8')
}

async function resolveSingleError(
  _parent: unknown,
  args: RootQueryTypeErrorArgs,
  _context: unknown,
  _info: GraphQLResolveInfo
): Promise<ErrorModel | GraphQLError> {
  return (
    await Result.tryCatchFlat(ErrorModel.loadSingleError, convertUnknownToApiError, args)
  ).match(
    (data) => data,
    (error) => {
      console.error(`Error resolving ${GRAPHQL_FIELD_ERROR_GLOBAL}:`, error)
      if (!error.isUserError()) {
        Sentry.captureException(error)
      }
      return new GraphQLError(error.isPrivate() ? 'Internal Server Error' : error.message)
    }
  )
}

async function resolveErrors(
  _parent: unknown,
  args: RootQueryTypeErrorsArgs,
  _context: unknown,
  _info: GraphQLResolveInfo
): Promise<ErrorCollection | GraphQLError> {
  return (
    await Result.tryCatchFlat(
      async (...args) => {
        const fetch: CollectionFetch<
          ErrorModel,
          { service?: Service; code?: string },
          ApiError
        >['fetch'] = async (fetchArgs) => {
          const result = await ErrorModel.loadErrors({
            ...fetchArgs,
            additionalArgs: {
              service: args[0].service ?? undefined,
              code: args[0].code ?? undefined,
            },
          })
          return result.mapError(
            (error) =>
              new ApiError(
                `Failed to resolve error codes: ${extractMessageFromAnyError(error)}`,
                error
              )
          )
        }
        return await GraphQLCollectionBuilder.create<
          ErrorModel,
          { service?: Service; code?: string },
          ApiError
        >({
          fetch,
          args: {
            ...args[0],
            // Decode base64 cursors before passing to fetch function
            after: args[0].after ? decodeBase64(args[0].after) : undefined,
            before: args[0].before ? decodeBase64(args[0].before) : undefined,
          },
          getCursor: (item) => encodeBase64(item.id),
        })
      },
      convertUnknownToApiError,
      args
    )
  ).match(
    (data) => data as ErrorCollection,
    (error) => {
      console.error(`Error resolving ${GRAPHQL_FIELD_ERRORS_GLOBAL}:`, error)
      if (error instanceof ApiError && !error.isUserError()) {
        Sentry.captureException(error)
      }
      return error instanceof GraphQLError
        ? error
        : new GraphQLError(error.isPrivate() ? 'Internal Server Error' : error.message)
    }
  )
}

export const errorRoot = {
  [GRAPHQL_FIELD_ERROR_GLOBAL]: {
    description: 'Get the details of an error code returned from a Supabase service',
    args: {
      code: {
        type: new GraphQLNonNull(GraphQLString),
      },
      service: {
        type: new GraphQLNonNull(GraphQLEnumTypeService),
      },
    },
    type: GraphQLObjectTypeError,
    resolve: resolveSingleError,
  },
}

export const errorsRoot = {
  [GRAPHQL_FIELD_ERRORS_GLOBAL]: {
    description: 'Get error codes that can potentially be returned by Supabase services',
    args: {
      ...paginationArgs,
      service: {
        type: GraphQLEnumTypeService,
        description: 'Filter errors by a specific Supabase service',
      },
      code: {
        type: GraphQLString,
        description: 'Filter errors by a specific error code',
      },
    },
    type: createCollectionType(GraphQLObjectTypeError),
    resolve: resolveErrors,
  },
}
