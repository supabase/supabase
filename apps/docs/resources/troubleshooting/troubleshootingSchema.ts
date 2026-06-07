import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLInterfaceTypeSearchResult } from '../globalSearch/globalSearchSchema'
import { TroubleshootingModel } from './troubleshootingModel'

export const GraphQLObjectTypeTroubleshooting = new GraphQLObjectType({
  name: 'TroubleshootingGuide',
  interfaces: [GraphQLInterfaceTypeSearchResult],
  isTypeOf: (value: unknown) => value instanceof TroubleshootingModel,
  description: 'A document describing how to troubleshoot an issue when using Supabase',
  fields: {
    title: {
      type: GraphQLString,
      description: 'The title of the troubleshooting guide',
    },
    href: {
      type: GraphQLString,
      description: 'The URL of the troubleshooting guide',
    },
    content: {
      type: GraphQLString,
      description: 'The full content of the troubleshooting guide',
    },
  },
})
