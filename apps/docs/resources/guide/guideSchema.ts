import { GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLInterfaceTypeSearchResult } from '../globalSearch/globalSearchSchema'
import { GuideModel, SubsectionModel } from './guideModel'
import { createCollectionType, GraphQLCollectionBuilder } from '../utils/connections'

export const GraphQLObjectTypeSubsection = new GraphQLObjectType({
  name: 'Subsection',
  isTypeOf: (value: unknown) => value instanceof SubsectionModel,
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
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The unique identifier of the search result',
    },
    title: {
      type: GraphQLString,
      description: 'The title of the matching content',
    },
    href: {
      type: GraphQLString,
      description: 'The URL of the guide',
    },
    description: {
      type: GraphQLString,
      description: 'A brief description of the matching content',
    },
    content: {
      type: GraphQLString,
      description: 'The full content of the matching result.',
    },
    subsections: {
      type: createCollectionType(GraphQLObjectTypeSubsection),
      description: 'The subsections of the guide',
      resolve: (node: GuideModel) => GraphQLCollectionBuilder.create({ items: node.subsections }),
    },
  },
})
