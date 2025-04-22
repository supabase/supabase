import {
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { createCollectionType, type InferArgTypes } from '../common'

export const GRAPHQL_FIELD_SEARCH_GLOBAL = 'searchDocs'

const searchResultArgs = {
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
    description: {
      type: GraphQLString,
      description: 'A brief description of the matching content.',
    },
    content: {
      type: GraphQLString,
      description: 'The full content of the matching result.',
    },
  },
  resolveType: () => 'DocSearchResult',
})

export const GraphQLObjectTypeDocSearchResult = new GraphQLObjectType({
  name: 'DocSearchResult',
  interfaces: [GraphQLInterfaceTypeSearchResult],
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The unique identifier of the search result',
    },
    title: {
      type: GraphQLString,
      description: 'The title of the matcihng content',
    },
    description: {
      type: GraphQLString,
      description: 'A brief description of the matching content',
    },
    content: {
      type: GraphQLString,
      description: 'The full content of the matching result.',
    },
  },
})

export const searchResultsSchema = {
  [GRAPHQL_FIELD_SEARCH_GLOBAL]: {
    args: searchResultArgs,
    type: createCollectionType(GraphQLInterfaceTypeSearchResult, 'SearchResultCollection'),
  },
}
