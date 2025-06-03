import { GraphQLError, GraphQLNonNull, GraphQLResolveInfo, GraphQLString } from 'graphql'
import { type RootQueryTypeErrorArgs } from '~/__generated__/graphql'
import { convertUnknownToApiError } from '~/app/api/utils'
import { Result } from '~/features/helpers.fn'
import { ErrorModel } from './errorModel'
import {
  GRAPHQL_FIELD_ERROR_GLOBAL,
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
