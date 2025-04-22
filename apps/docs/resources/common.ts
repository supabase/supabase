import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLString,
  type GraphQLType,
} from 'graphql'
import { nanoId } from '~/features/helpers.misc'

export type ArgDefinition<T = unknown> = {
  type: GraphQLInputType
  description?: string
  defaultValue?: T
  required?: boolean
}

type InferGraphQLEnumType<T extends GraphQLEnumType> = ReturnType<
  T['getValues']
>[number]['name'] extends infer V
  ? V extends string
    ? V
    : never
  : never

type InferGraphQLScalarType<T extends GraphQLScalarType<unknown, unknown>> =
  T extends GraphQLScalarType<infer _Internal, infer External> ? External : never

type InferGraphQLInputObjectType<T extends GraphQLInputObjectType> = {
  [K in keyof ReturnType<T['getFields']>]: InferGraphQLInputType<
    ReturnType<T['getFields']>[K]['type']
  >
}

type InferGraphQLListType<T extends GraphQLList<Inner>, Inner extends GraphQLType> =
  T extends GraphQLList<infer L>
    ? L extends GraphQLInputType
      ? Array<InferGraphQLInputType<L>>
      : never
    : never

type InferGraphQLNonNullType<T extends GraphQLNonNull<Inner>, Inner extends GraphQLNullableType> =
  T extends GraphQLNonNull<infer U>
    ? U extends GraphQLEnumType
      ? InferGraphQLEnumType<U>
      : U extends GraphQLScalarType
        ? InferGraphQLScalarType<U>
        : U extends GraphQLInputObjectType
          ? InferGraphQLInputObjectType<U>
          : U extends GraphQLList<infer Inner>
            ? InferGraphQLListType<U, Inner>
            : never
    : never

type InferGraphQLNullableType<T extends GraphQLNullableType> = T extends GraphQLEnumType
  ? InferGraphQLEnumType<T> | null
  : T extends GraphQLScalarType<unknown, unknown>
    ? InferGraphQLScalarType<T> | null
    : T extends GraphQLInputObjectType
      ? InferGraphQLInputObjectType<T> | null
      : T extends GraphQLList<infer Inner>
        ? InferGraphQLListType<T, Inner> | null
        : null

type InferGraphQLInputType<T extends GraphQLInputType> =
  T extends GraphQLNonNull<infer Inner>
    ? InferGraphQLNonNullType<T, Inner>
    : InferGraphQLNullableType<T>

type RequiredKeys<T extends Record<string, ArgDefinition>> = {
  [K in keyof T]: T[K] extends { required: true } ? K : never
}[keyof T]

type OptionalKeys<T extends Record<string, ArgDefinition>> = {
  [K in keyof T]: T[K] extends { required: true } ? never : K
}[keyof T]

export type InferArgTypes<T extends Record<string, ArgDefinition>> = {
  [K in RequiredKeys<T>]: InferGraphQLInputType<T[K]['type']>
} & {
  [K in OptionalKeys<T>]?: InferGraphQLInputType<T[K]['type']>
}

export const PageInfoType = new GraphQLObjectType({
  name: 'PageInfo',
  description: 'Information about pagination in a collection',
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
 * Extracts the name from a a GraphQLOutputType.
 * @param nodeType The GraphQLOutputType to get the name for.
 */
function extractNodeTypeName(nodeType: GraphQLOutputType): string | undefined {
  if ('name' in nodeType) {
    return nodeType.name
  } else {
    return `Anonymous:${nanoId()}`
  }
}

/**
 * Creates an Edge type for a specific node type
 * @param nodeType The GraphQL Object type for the node
 * @param name Optional name for the edge (defaults to NodeType + 'Edge')
 * @returns A GraphQL Object Type for the edge
 */
function createEdgeType(nodeType: GraphQLOutputType, name?: string): GraphQLObjectType {
  const edgeName = name || `${extractNodeTypeName(nodeType)}Edge`

  return new GraphQLObjectType({
    name: edgeName,
    description: `An edge in a collection for ${extractNodeTypeName(nodeType)}`,
    fields: {
      node: {
        type: new GraphQLNonNull(nodeType),
        description: 'The item at the end of the edge',
      },
      cursor: {
        type: new GraphQLNonNull(GraphQLString),
        description: 'A cursor for use in pagination',
      },
    },
  })
}

/**
 * Creates a Collection type for a specific node type
 * @param nodeType The GraphQL Object type for the node
 * @param name Optional name for the collection (defaults to NodeType + 'Collection')
 * @returns A GraphQL Object Type for the collection
 */
export function createCollectionType(
  nodeType: GraphQLOutputType,
  name?: string
): GraphQLObjectType {
  const collectionName = name || `${extractNodeTypeName(nodeType)}Collection`
  const edgeType = createEdgeType(nodeType)

  return new GraphQLObjectType({
    name: collectionName,
    description: `A collection of ${extractNodeTypeName(nodeType)} items`,
    fields: {
      edges: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(edgeType))),
        description: 'A list of edges containing nodes in this collection',
      },
      nodes: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(nodeType))),
        description: 'The nodes in this collection, directly accessible',
      },
      pageInfo: {
        type: new GraphQLNonNull(PageInfoType),
        description: 'Information to aid in pagination',
      },
      totalCount: {
        type: new GraphQLNonNull(GraphQLInt),
        description: 'The total count of items available in this collection',
      },
    },
  })
}

/**
 * Standard pagination arguments for GraphQL fields
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
export type IPaginationArgs = InferArgTypes<typeof paginationArgs>

interface CollectionFetch<T, TArgs = unknown> {
  fetch: (
    args?: IPaginationArgs & {
      additionalArgs?: TArgs
    }
  ) => Promise<{
    items: T[]
    totalCount: number
    hasNextPage?: boolean
    hasPreviousPage?: boolean
  }>
  args?: IPaginationArgs & {
    additionalArgs?: TArgs
  }
  getCursor?: (item: T, idx?: number) => string
  items?: never
}
interface CollectionInMemory<T> {
  items: T[]
  args?: IPaginationArgs
  fetch?: never
  getCursor?: never
}
type CollectionBuildArgs<T, TArgs = unknown> = (CollectionFetch<T, TArgs> | CollectionInMemory<T>) &
  IPaginationArgs

export class GraphQLCollectionBuilder {
  static async create<T, TArgs = unknown>(options: CollectionBuildArgs<T, TArgs>) {
    const { fetch, args = {}, getCursor, items } = options

    if (items) {
      return GraphQLCollectionBuilder.paginateArray({ items, ...args })
    }

    const result = await fetch(args)
    const { items: fetchedItems, totalCount, hasNextPage = false, hasPreviousPage = false } = result
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

  private static paginateArray<T>({
    items,
    first,
    last,
    after,
    before,
  }: CollectionInMemory<T> & IPaginationArgs) {
    const getCursor = (_item: T, idx: number) => String(idx)
    const allEdges = items.map((item, idx) => {
      return { node: item, cursor: getCursor(item, idx) }
    })

    let hasNextPage = false
    let hasPreviousPage = false

    let beforeIndex = allEdges.length
    let afterIndex = -1
    if (before) {
      const requestedBefore = Number(before)
      if (requestedBefore >= 0 && requestedBefore < beforeIndex) {
        beforeIndex = requestedBefore
        hasNextPage = true
      }
    }
    if (after) {
      const requestedAfter = Number(after)
      if (requestedAfter >= 0) {
        afterIndex = requestedAfter
        hasPreviousPage = true
      }
    }
    let edges = allEdges.slice(afterIndex + 1, beforeIndex)

    if (first >= 0) {
      if (edges.length > first) {
        edges = edges.slice(0, first)
        hasNextPage = true
      }
    } else if (last >= 0) {
      if (edges.length > last) {
        edges = edges.slice(edges.length - last)
        hasPreviousPage = true
      }
    }

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
