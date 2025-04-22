import { GraphQLError } from 'graphql'
import { GraphQLCollectionBuilder } from '../common'
import { SearchResultModel } from './globalSearchModel'
import { GRAPHQL_FIELD_SEARCH_GLOBAL, type ISearchResultArgs } from './globalSearchSchema'

async function searchResolverImpl(args: ISearchResultArgs) {
  const result = await SearchResultModel.search(args)
  return result.match(
    (data) => {
      return GraphQLCollectionBuilder.create({ items: data })
    },
    (error) => {
      console.error(`Error resolving ${GRAPHQL_FIELD_SEARCH_GLOBAL}:`, error)
      return new GraphQLError(error.isPrivate() ? 'Internal Server Error' : error.message)
    }
  )
}

export const searchResolver = {
  [GRAPHQL_FIELD_SEARCH_GLOBAL]: searchResolverImpl,
}
