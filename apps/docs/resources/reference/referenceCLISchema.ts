import { GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLInterfaceTypeSearchResult } from '../globalSearch/globalSearchSchema'
import { ReferenceCLICommandModel } from './referenceCLIModel'

export const GraphQLObjectTypeReferenceCLICommand = new GraphQLObjectType({
  name: 'CLICommandReference',
  interfaces: [GraphQLInterfaceTypeSearchResult],
  isTypeOf: (value: unknown) => value instanceof ReferenceCLICommandModel,
  description: 'A reference document containing a description of a Supabase CLI command',
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
