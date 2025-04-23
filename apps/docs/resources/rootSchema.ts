import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import { searchRoot } from './globalSearch/globalSearchResolver'
import { GraphQLObjectTypeGuide } from './guide/guideSchema'
import { introspectRoot } from './introspect/introspectResolver'

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
