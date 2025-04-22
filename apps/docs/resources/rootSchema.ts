import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import {
  GraphQLObjectTypeDocSearchResult,
  searchResultsSchema,
} from './globalSearch/globalSearchSchema'

export const rootGraphQLSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      ...searchResultsSchema,
    },
  }),
  types: [GraphQLObjectTypeDocSearchResult],
})
