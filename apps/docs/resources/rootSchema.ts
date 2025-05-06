import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  printSchema,
} from 'graphql'
import { RootQueryTypeResolvers } from '~/__generated__/graphql'
import { searchRoot } from './globalSearch/globalSearchResolver'
import { GraphQLObjectTypeGuide } from './guide/guideSchema'

const GRAPHQL_FIELD_INTROSPECT = 'schema' as const

type IntrospectResolver = RootQueryTypeResolvers[typeof GRAPHQL_FIELD_INTROSPECT]

const resolveIntrospect: IntrospectResolver = async () => {
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
      ...searchRoot,
    },
  }),
  types: [GraphQLObjectTypeGuide],
})
