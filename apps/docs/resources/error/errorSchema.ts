import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { SERVICES } from './errorModel'

export const GRAPHQL_FIELD_ERROR_GLOBAL = 'error' as const
export const GRAPHQL_FIELD_ERRORS_GLOBAL = 'errors' as const

export const GraphQLEnumTypeService = new GraphQLEnumType({
  name: 'Service',
  values: SERVICES,
})

export const GraphQLObjectTypeError = new GraphQLObjectType({
  name: 'Error',
  description: 'An error returned by a Supabase service',
  fields: {
    code: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        'The unique code identifying the error. The code is stable, and can be used for string matching during error handling.',
    },
    service: {
      type: new GraphQLNonNull(GraphQLEnumTypeService),
      description: 'The Supabase service that returns this error.',
    },
    httpStatusCode: {
      type: GraphQLInt,
      description: 'The HTTP status code returned with this error.',
    },
    message: {
      type: GraphQLString,
      description:
        'A human-readable message describing the error. The message is not stable, and should not be used for string matching during error handling. Use the code instead.',
    },
  },
})
