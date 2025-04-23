import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLScalarType,
  type GraphQLType,
} from 'graphql'

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
