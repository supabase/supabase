import { GraphQLString, printSchema } from 'graphql'
import { rootGraphQLSchema } from '../rootSchema'

const GRAPHQL_FIELD_INTROSPECT = 'schema'

async function resolveIntrospect() {
  const schema = printSchema(rootGraphQLSchema)
  return schema
}

export const introspectRoot = {
  [GRAPHQL_FIELD_INTROSPECT]: {
    description: 'Get the GraphQL schema for this endpoint',
    type: GraphQLString,
    resolve: resolveIntrospect,
  },
}
