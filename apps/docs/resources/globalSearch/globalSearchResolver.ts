import {
  GraphQLError,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
  type GraphQLResolveInfo,
} from 'graphql'
import {
  type RootQueryTypeSearchDocsArgs,
  type SearchResultCollection,
} from '~/__generated__/graphql'
import { convertUnknownToApiError, type ApiErrorGeneric } from '~/app/api/utils'
import { Result } from '~/features/helpers.fn'
import { createCollectionType, GraphQLCollectionBuilder } from '../utils/connections'
import { graphQLFields } from '../utils/fields'
import { SearchResultModel } from './globalSearchModel'
import { GRAPHQL_FIELD_SEARCH_GLOBAL, GraphQLInterfaceTypeSearchResult } from './globalSearchSchema'

async function resolveSearch(
  parent: unknown,
  args: RootQueryTypeSearchDocsArgs,
  context: unknown,
  info: GraphQLResolveInfo
): Promise<SearchResultCollection | GraphQLError> {
  return (
    await Result.tryCatchFlat(
      resolveSearchImpl,
      convertUnknownToApiError,
      parent,
      args,
      context,
      info
    )
  ).match(
    (data) => GraphQLCollectionBuilder.create({ items: data }),
    (error) => {
      console.error(`Error resolving ${GRAPHQL_FIELD_SEARCH_GLOBAL}:`, error)
      return new GraphQLError(error.isPrivate() ? 'Internal Server Error' : error.message)
    }
  )
}

async function resolveSearchImpl(
  _parent: unknown,
  args: RootQueryTypeSearchDocsArgs,
  _context: unknown,
  info: GraphQLResolveInfo
): Promise<Result<Array<SearchResultModel>, ApiErrorGeneric>> {
  const fieldsInfo = graphQLFields(info)
  const requestedFields = Object.keys(fieldsInfo.nodes ?? fieldsInfo.edges?.node ?? {})
  return await SearchResultModel.search(args, requestedFields)
}

export const searchRoot = {
  [GRAPHQL_FIELD_SEARCH_GLOBAL]: {
    description: 'Search the Supabase docs for content matching a query string',
    args: {
      query: {
        type: new GraphQLNonNull(GraphQLString),
      },
      limit: {
        type: GraphQLInt,
      },
    },
    type: createCollectionType(GraphQLInterfaceTypeSearchResult, {
      skipPageInfo: true,
      description: 'A collection of search results containing content from Supabase docs',
    }),
    resolve: resolveSearch,
  },
}
