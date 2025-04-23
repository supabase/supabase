import { GraphQLID, GraphQLInterfaceType, GraphQLNonNull, GraphQLString } from 'graphql'
import { type InferArgTypes } from '../utils/types'

export const GRAPHQL_FIELD_SEARCH_GLOBAL = 'searchDocs'

export const searchResultArgs = {
  query: {
    required: true,
    type: GraphQLString,
  },
} as const // const needed for proper type inference of required fields
export type ISearchResultArgs = InferArgTypes<typeof searchResultArgs>

export const GraphQLInterfaceTypeSearchResult = new GraphQLInterfaceType({
  name: 'SearchResult',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The unique identifier of the search result.',
    },
    title: {
      type: GraphQLString,
      description: 'The title of the matching content.',
    },
    href: {
      type: GraphQLString,
      description: 'The URL of the matching content.',
    },
    // description: {
    //   type: GraphQLString,
    //   description: 'A brief description of the matching content.',
    // },
    content: {
      type: GraphQLString,
      description: 'The full content of the matching result.',
    },
  },
})
