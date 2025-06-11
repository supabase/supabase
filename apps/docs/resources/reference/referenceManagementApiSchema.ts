import { GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLInterfaceTypeSearchResult } from '../globalSearch/globalSearchSchema'
import { ReferenceManagementApiModel } from './referenceManagementApiModel'

export const GraphQLObjectTypeReferenceManagementApi = new GraphQLObjectType({
  name: 'ManagementApiReference',
  interfaces: [GraphQLInterfaceTypeSearchResult],
  isTypeOf: (value: unknown) => value instanceof ReferenceManagementApiModel,
  description:
    'A reference document containing a description of a Supabase Management API endpoint',
  fields: {
    title: {
      type: GraphQLString,
      description: 'The title of the document',
    },
    href: {
      type: GraphQLString,
      description: 'The URL of the document',
    },
    content: {
      type: GraphQLString,
      description: 'The content of the reference document, as text',
    },
  },
})
