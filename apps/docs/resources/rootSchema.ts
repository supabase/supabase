import { GraphQLObjectType, GraphQLSchema } from 'graphql'

export const rootGraphQLSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {},
  }),
})
