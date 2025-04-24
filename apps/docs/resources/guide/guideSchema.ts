import { GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLInterfaceTypeSearchResult } from '../globalSearch/globalSearchSchema'
import { GuideModel, SubsectionModel } from './guideModel'
import { createCollectionType, GraphQLCollectionBuilder } from '../utils/connections'

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
      description: 'The title of the matching content',
    },
    href: {
      type: GraphQLString,
      description: 'The URL of the guide',
    },
    content: {
      type: GraphQLString,
      description:
        'The full content of the matching result, including all subsections and possibly more content',
    },
    subsections: {
      type: createCollectionType(GraphQLObjectTypeSubsection, {
        skipPageInfo: true,
        description:
          'A collection of content chunks taken from a larger document in the Supabase docs',
      }),
      description: 'The subsections of the guide',
      resolve: (node: GuideModel) => GraphQLCollectionBuilder.create({ items: node.subsections }),
    },
  },
})
