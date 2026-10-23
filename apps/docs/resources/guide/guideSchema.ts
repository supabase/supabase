import { GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLInterfaceTypeSearchResult } from '../globalSearch/globalSearchSchema'
import { createCollectionType, GraphQLCollectionBuilder } from '../utils/connections'
import { GuideModel, SubsectionModel } from './guideModel'

export const GraphQLObjectTypeSubsection = new GraphQLObjectType({
  name: 'Subsection',
  isTypeOf: (value: unknown) => value instanceof SubsectionModel,
  description: 'A content chunk taken from a larger document in the Supabase docs',
  fields: {
    title: {
      type: GraphQLString,
      description: 'The title of the subsection',
    },
    href: {
      type: GraphQLString,
      description: 'The URL of the subsection',
    },
    content: {
      type: GraphQLString,
      description: 'The content of the subsection',
    },
  },
})

export const GraphQLObjectTypeGuide = new GraphQLObjectType({
  name: 'Guide',
  interfaces: [GraphQLInterfaceTypeSearchResult],
  isTypeOf: (value: unknown) => value instanceof GuideModel,
  description:
    'A document containing content from the Supabase docs. This is a guide, which might describe a concept, or explain the steps for using or implementing a feature.',
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
      description:
        'The full content of the document, including all subsections (both those matching and not matching any query string) and possibly more content',
    },
    subsections: {
      type: createCollectionType(GraphQLObjectTypeSubsection, {
        skipPageInfo: true,
        description: 'A collection of content chunks from a larger document in the Supabase docs.',
      }),
      description:
        'The subsections of the document. If the document is returned from a search match, only matching content chunks are returned. For the full content of the original document, use the content field in the parent Guide.',
      resolve: async (node: GuideModel) =>
        (await GraphQLCollectionBuilder.create({ items: node.subsections })).unwrap(),
    },
  },
})
