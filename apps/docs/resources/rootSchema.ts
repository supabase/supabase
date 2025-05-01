import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  printSchema,
} from 'graphql'

const GRAPHQL_FIELD_INTROSPECT = 'schema'

async function resolveIntrospect() {
  const schema = printSchema(rootGraphQLSchema)
  return schema
}

const introspectRoot = {
  [GRAPHQL_FIELD_INTROSPECT]: {
    description: 'Get the GraphQL schema for this endpoint',
    type: new GraphQLNonNull(GraphQLString),
    resolve: resolveIntrospect,
  },
}

export const rootGraphQLSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      ...introspectRoot,
    },
  }),
})
