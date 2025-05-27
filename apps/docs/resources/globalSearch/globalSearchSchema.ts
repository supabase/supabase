import { GraphQLInterfaceType, GraphQLString } from 'graphql'

export const GRAPHQL_FIELD_SEARCH_GLOBAL = 'searchDocs' as const

export const GraphQLInterfaceTypeSearchResult = new GraphQLInterfaceType({
  name: 'SearchResult',
  description: 'Document that matches a search query',
  fields: {
    title: {
      type: GraphQLString,
      description: 'The title of the matching result',
    },
    href: {
      type: GraphQLString,
      description: 'The URL of the matching result',
    },
    content: {
      type: GraphQLString,
      description: 'The full content of the matching result',
    },
  },
})
