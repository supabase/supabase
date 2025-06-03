import { GraphQLError, GraphQLNonNull, GraphQLResolveInfo, GraphQLString } from 'graphql'
import type {
  ErrorCollection,
  RootQueryTypeErrorArgs,
  RootQueryTypeErrorsArgs,
} from '~/__generated__/graphql'
import { ApiError, convertUnknownToApiError } from '~/app/api/utils'
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
        const fetch: CollectionFetch<ErrorModel, never, ApiError>['fetch'] = async (fetchArgs) => {
          const result = await ErrorModel.loadErrors(fetchArgs ?? {})
          return result.mapError((error) => new ApiError('Failed to resolve error codes', error))
        }
        return await GraphQLCollectionBuilder.create<ErrorModel, never, ApiError>({
          fetch,
          args: args[0],
          getCursor: (item) => item.id,
        })
      },
      convertUnknownToApiError,
      args
    )
  ).match(
    (data) => data as ErrorCollection,
    (error) => {
      console.error(`Error resolving ${GRAPHQL_FIELD_ERRORS_GLOBAL}:`, error)
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
    args: paginationArgs,
    type: createCollectionType(GraphQLObjectTypeError),
    resolve: resolveErrors,
  },
}
