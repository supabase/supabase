import { GraphQLEnumType, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLInterfaceTypeSearchResult } from '../globalSearch/globalSearchSchema'
import { ReferenceSDKFunctionModel, SDKLanguages } from './referenceSDKModel'

const GraphQLEnumLanguage = new GraphQLEnumType({
  name: 'Language',
  values: Object.keys(SDKLanguages).reduce((acc, key) => {
    acc[key] = { value: SDKLanguages[key].value }
    return acc
  }, {}),
})

export const GraphQLObjectTypeReferenceSDKFunction = new GraphQLObjectType({
  name: 'ClientLibraryFunctionReference',
  interfaces: [GraphQLInterfaceTypeSearchResult],
  isTypeOf: (value: unknown) => value instanceof ReferenceSDKFunctionModel,
  description:
    'A reference document containing a description of a function from a Supabase client library',
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
    language: {
      type: new GraphQLNonNull(GraphQLEnumLanguage),
      description: 'The programming language for which the function is written',
    },
    methodName: {
      type: GraphQLString,
      description: 'The name of the function or method',
    },
  },
})
