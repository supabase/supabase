import { GraphQLError, type GraphQLResolveInfo } from 'graphql'
import { SearchResultModel } from './globalSearchModel'
import {
  GRAPHQL_FIELD_SEARCH_GLOBAL,
  GraphQLInterfaceTypeSearchResult,
  searchResultArgs,
  type ISearchResultArgs,
} from './globalSearchSchema'
import { createCollectionType, GraphQLCollectionBuilder } from '../utils/connections'
import { graphQLFields } from '../utils/fields'

async function resolveSearch(
  _parent: unknown,
  args: ISearchResultArgs,
  _context: unknown,
  info: GraphQLResolveInfo
) {
  try {
    const requestedFields = Object.keys(graphQLFields(info).nodes)
    const result = await SearchResultModel.search(args, requestedFields)
    return result.match(
      (data) => {
        return GraphQLCollectionBuilder.create({ items: data })
      },
      (error) => {
        console.error(`Error resolving ${GRAPHQL_FIELD_SEARCH_GLOBAL}:`, error)
        return new GraphQLError(error.isPrivate() ? 'Internal Server Error' : error.message)
      }
    )
  } catch (error) {
    console.error(`Unknown error resolving ${GRAPHQL_FIELD_SEARCH_GLOBAL}:`, error)
    return new GraphQLError('Internal Server Error')
  }
}

export const searchRoot = {
  [GRAPHQL_FIELD_SEARCH_GLOBAL]: {
    description: '',
    args: searchResultArgs,
    type: createCollectionType(GraphQLInterfaceTypeSearchResult, { skipPageInfo: true }),
    resolve: resolveSearch,
  },
}
