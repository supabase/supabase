import {
  GraphQLBoolean,
  GraphQLError,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  type GraphQLOutputType,
  GraphQLString,
} from 'graphql'
import { Result } from '~/features/helpers.fn'
import { nanoId } from '~/features/helpers.misc'

/**
 * Extracts the name from a a GraphQLOutputType.
 */
function extractNodeTypeName(
  /**
   * The GraphQL Output Type to extract the name from.
   */
  nodeType: GraphQLOutputType
): string | undefined {
  if ('name' in nodeType) {
    return nodeType.name
  } else {
    return `AnonymousNode(${nanoId()})`
  }
}

/**
 * Creates an Edge type for a specific node type. An Edge type wraps the node
 * alongside an optional associated cursor, for example:
 *
 * ```
 * {
 *   edges: [
 *     {
 *       node: {
 *         id: '123',
 *         name: 'John Doe'
 *       },
 *       cursor: 'YXJyYXljb25uZWN0aW9uOjE='
 *     }
 *   ]
 * }
 * ```
 */
function createEdgeType(
  nodeType: GraphQLOutputType,
  {
    name,
    skipCursor = false,
  }: {
    /**
     * The name of the created Edge node. If not provided, defaults to
     * NameOfInnerNodeEdge.
     */
    name?: string
    /**
     * Whether to skip the cursor field.
     */
    skipCursor?: boolean
  } = {}
): GraphQLObjectType {
  const edgeName = name || `${extractNodeTypeName(nodeType)}Edge`

  return new GraphQLObjectType({
    name: edgeName,
    description: `An edge in a collection of ${extractNodeTypeName(nodeType)}s`,
    fields: {
      node: {
        type: new GraphQLNonNull(nodeType),
        description: `The ${extractNodeTypeName(nodeType)} at the end of the edge`,
      },
      ...(!skipCursor && {
        cursor: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'A cursor for use in pagination',
        },
      }),
    },
  })
}

/**
 * Standard GraphQL type for pagination information on connections
 */
const PageInfoType = new GraphQLObjectType({
  name: 'PageInfo',
  description: 'Pagination information for a collection',
  fields: {
    hasNextPage: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Whether there are more items after the current page',
    },
    hasPreviousPage: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Whether there are more items before the current page',
    },
    startCursor: {
      type: GraphQLString,
      description: 'Cursor pointing to the start of the current page',
    },
    endCursor: {
      type: GraphQLString,
      description: 'Cursor pointing to the end of the current page',
    },
  },
})

/**
 * Creates a Collection type for a specific node type. A collection type
 * represents a list of nodes with pagination information, and has the shape:
 *
 * ```
 * {
 *   edges: [
 *     {
 *       node: { ... },
 *       cursor: '...'
 *     },
 *     ...
 *   ],
 *   nodes: [ ... ],
 *   pageInfo: {
 *     hasNextPage: true,
 *     hasPreviousPage: false,
 *     startCursor: '...',
 *     endCursor: '...'
 *   }
 * }
 * ```
 */
export function createCollectionType(
  nodeType: GraphQLOutputType,
  {
    name,
    description,
    skipPageInfo = false,
  }: {
    /**
     * The name of the generated collection.
     *
     * If omitted, defaults to NameOfInnerNodeCollection.
     */
    name?: string
    /**
     * A description of the collection that will be outputted in the generated
     * schema as documentation.
     */
    description?: string
    /**
     * Whether to skip the pageInfo field.
     */
    skipPageInfo?: boolean
  } = {}
): GraphQLObjectType {
  const collectionName = name || `${extractNodeTypeName(nodeType)}Collection`
  const edgeType = createEdgeType(nodeType, { skipCursor: skipPageInfo })

  return new GraphQLObjectType({
    name: collectionName,
    description: description || `A collection of ${extractNodeTypeName(nodeType)}s`,
    fields: {
      edges: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(edgeType))),
        description: 'A list of edges containing nodes in this collection',
      },
      nodes: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(nodeType))),
        description: 'The nodes in this collection, directly accessible',
      },
      ...(!skipPageInfo && {
        pageInfo: {
          type: new GraphQLNonNull(PageInfoType),
          description: 'Pagination information',
        },
      }),
      totalCount: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The total count of items available in this collection',
      },
    },
  })
}

/**
 * Interface for standard pagination arguments for a GraphQL connection
 */
export interface IPaginationArgs {
  first?: number | null
  after?: string | null
  last?: number | null
  before?: string | null
}

/**
 * Standard pagination arguments for a GraphQL connection
 */
export const paginationArgs = {
  first: {
    type: GraphQLInt,
    description: 'Returns the first n elements from the list',
  },
  after: {
    type: GraphQLString,
    description: 'Returns elements that come after the specified cursor',
  },
  last: {
    type: GraphQLInt,
    description: 'Returns the last n elements from the list',
  },
  before: {
    type: GraphQLString,
    description: 'Returns elements that come before the specified cursor',
  },
}

/**
 * Interface for a fetch definition used to fetch a collection of items for a
 * GraphQL query. Takes standard pagination args and returns standard page
 * information.
 */
export interface CollectionFetch<ItemType, FetchArgs = unknown, ErrorType = Error> {
  fetch: (
    args?: IPaginationArgs & {
      additionalArgs?: FetchArgs
    }
  ) => Promise<
    Result<
      {
        items: Array<ItemType>
        totalCount: number
        hasNextPage?: boolean
        hasPreviousPage?: boolean
      },
      ErrorType
    >
  >
  args?: IPaginationArgs & {
    additionalArgs?: FetchArgs
  }
  getCursor: (item: ItemType, idx?: number) => string
  items?: never
}

/**
 * Interface for parameters used to build a collection of items from an array
 * in memory
 */
interface CollectionInMemory<ItemType> {
  items: Array<ItemType>
  args?: IPaginationArgs
  fetch?: never
  getCursor?: never
}

interface GraphQLCollection<ItemType> {
  edges: Array<{ node: ItemType; cursor: string }>
  nodes: Array<ItemType>
  totalCount: number
  pageInfo: {
    hasNextPage: boolean
    hasPreviousPage: boolean
    startCursor: string | null
    endCursor: string | null
  }
}

/**
 * Union type for parameters to build a collection. Can be a remote collection
 * that needs to be fetched or a local one in memory.
 */
type CollectionBuildArgs<ItemType, FetchArgs = unknown, ErrorType = Error> =
  | CollectionFetch<ItemType, FetchArgs, ErrorType>
  | CollectionInMemory<ItemType>

export class GraphQLCollectionBuilder {
  static async create<ItemType, FetchArgs = unknown, ErrorType = Error>(
    options: CollectionBuildArgs<ItemType, FetchArgs, ErrorType>
  ): Promise<Result<GraphQLCollection<ItemType>, GraphQLError | ErrorType>> {
    const { fetch, args = {}, getCursor, items } = options

    if (items) {
      return Result.ok(GraphQLCollectionBuilder.paginateArray({ items, args }))
    }

    if (args.first && args.last) {
      return Result.error(new GraphQLError('Cannot specify both first and last arguments'))
    }

    return (await fetch(args)).map(
      ({ items: fetchedItems, totalCount, hasNextPage = false, hasPreviousPage = false }) => {
        const edges = fetchedItems.map((item) => {
          return { node: item, cursor: getCursor(item) }
        })

        return {
          edges,
          nodes: fetchedItems,
          totalCount,
          pageInfo: {
            hasNextPage,
            hasPreviousPage,
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          },
        }
      }
    )
  }

  private static paginateArray<T>({ items, args }: CollectionInMemory<T>) {
    const getCursor = (_item: T, idx: number) => String(idx)
    const allEdges = items.map((item, idx) => {
      return { node: item, cursor: getCursor(item, idx) }
    })

    const { edges, hasPreviousPage, hasNextPage } = getRequestedSlice(allEdges, args ?? {})

    return {
      edges,
      nodes: edges.map((edge) => edge.node),
      totalCount: allEdges.length,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges.length > 0 ? edges[0].cursor : null,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      },
    }
  }
}

interface TruncatedPageInfo<ItemType> {
  edges: Array<ItemType>
  hasNextPage: boolean
  hasPreviousPage: boolean
}

function getRequestedSlice<ItemType>(
  allEdges: Array<ItemType>,
  pageArgs: IPaginationArgs
): TruncatedPageInfo<ItemType> {
  let hasPreviousPage = false
  let hasNextPage = false

  let beforeIndex = allEdges.length
  let afterIndex = -1

  const requestedBefore = pageArgs.before ? toNumber(pageArgs.before) : undefined
  if (requestedBefore && requestedBefore >= 0 && requestedBefore < beforeIndex) {
    beforeIndex = requestedBefore
    hasNextPage = true
  }
  const requestedAfter = pageArgs.after ? toNumber(pageArgs.after) : undefined
  if (requestedAfter && requestedAfter >= 0) {
    afterIndex = requestedAfter
    hasPreviousPage = true
  }

  let edges = allEdges.slice(afterIndex + 1, beforeIndex)

  if (pageArgs.first != null && pageArgs.first >= 0 && edges.length > pageArgs.first) {
    edges = edges.slice(0, pageArgs.first)
    hasNextPage = true
  } else if (pageArgs.last != null && pageArgs.last >= 0 && edges.length > pageArgs.last) {
    edges = edges.slice(edges.length - pageArgs.last)
    hasPreviousPage = true
  }

  return {
    edges,
    hasNextPage,
    hasPreviousPage,
  }
}

function toNumber(value: string): number | undefined {
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}
