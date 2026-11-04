import { DocumentTypeDecoration } from '@graphql-typed-document-node/core'

/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }

export type Service = 'AUTH' | 'REALTIME' | 'STORAGE'

export type ErrorCodeQueryQueryVariables = Exact<{
  code: string
  service?: Service | null | undefined
}>

export type ErrorCodeQueryQuery = {
  errors: { nodes: Array<{ code: string; service: Service; message: string | null }> } | null
}

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>
  private value: string
  public __meta__?: Record<string, any> | undefined

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value)
    this.value = value
    this.__meta__ = __meta__
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value
  }
}

export const ErrorCodeQueryDocument = new TypedDocumentString(`
    query ErrorCodeQuery($code: String!, $service: Service) {
  errors(code: $code, service: $service) {
    nodes {
      code
      service
      message
    }
  }
}
    `) as unknown as TypedDocumentString<ErrorCodeQueryQuery, ErrorCodeQueryQueryVariables>
