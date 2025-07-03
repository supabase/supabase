/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never
}
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string }
  String: { input: string; output: string }
  Boolean: { input: boolean; output: boolean }
  Int: { input: number; output: number }
  Float: { input: number; output: number }
}

/** A reference document containing a description of a Supabase CLI command */
export type CliCommandReference = SearchResult & {
  __typename?: 'CLICommandReference'
  /** The content of the reference document, as text */
  content?: Maybe<Scalars['String']['output']>
  /** The URL of the document */
  href?: Maybe<Scalars['String']['output']>
  /** The title of the document */
  title?: Maybe<Scalars['String']['output']>
}

/** A reference document containing a description of a function from a Supabase client library */
export type ClientLibraryFunctionReference = SearchResult & {
  __typename?: 'ClientLibraryFunctionReference'
  /** The content of the reference document, as text */
  content?: Maybe<Scalars['String']['output']>
  /** The URL of the document */
  href?: Maybe<Scalars['String']['output']>
  /** The programming language for which the function is written */
  language: Language
  /** The name of the function or method */
  methodName?: Maybe<Scalars['String']['output']>
  /** The title of the document */
  title?: Maybe<Scalars['String']['output']>
}

/** An error returned by a Supabase service */
export type Error = {
  __typename?: 'Error'
  /** The unique code identifying the error. The code is stable, and can be used for string matching during error handling. */
  code: Scalars['String']['output']
  /** The HTTP status code returned with this error. */
  httpStatusCode?: Maybe<Scalars['Int']['output']>
  /** A human-readable message describing the error. The message is not stable, and should not be used for string matching during error handling. Use the code instead. */
  message?: Maybe<Scalars['String']['output']>
  /** The Supabase service that returns this error. */
  service: Service
}

/** A collection of Errors */
export type ErrorCollection = {
  __typename?: 'ErrorCollection'
  /** A list of edges containing nodes in this collection */
  edges: Array<ErrorEdge>
  /** The nodes in this collection, directly accessible */
  nodes: Array<Error>
  /** Pagination information */
  pageInfo: PageInfo
  /** The total count of items available in this collection */
  totalCount: Scalars['Int']['output']
}

/** An edge in a collection of Errors */
export type ErrorEdge = {
  __typename?: 'ErrorEdge'
  /** A cursor for use in pagination */
  cursor: Scalars['String']['output']
  /** The Error at the end of the edge */
  node: Error
}

/** A document containing content from the Supabase docs. This is a guide, which might describe a concept, or explain the steps for using or implementing a feature. */
export type Guide = SearchResult & {
  __typename?: 'Guide'
  /** The full content of the document, including all subsections (both those matching and not matching any query string) and possibly more content */
  content?: Maybe<Scalars['String']['output']>
  /** The URL of the document */
  href?: Maybe<Scalars['String']['output']>
  /** The subsections of the document. If the document is returned from a search match, only matching content chunks are returned. For the full content of the original document, use the content field in the parent Guide. */
  subsections?: Maybe<SubsectionCollection>
  /** The title of the document */
  title?: Maybe<Scalars['String']['output']>
}

export enum Language {
  Csharp = 'CSHARP',
  Dart = 'DART',
  Javascript = 'JAVASCRIPT',
  Kotlin = 'KOTLIN',
  Python = 'PYTHON',
  Swift = 'SWIFT',
}

/** Pagination information for a collection */
export type PageInfo = {
  __typename?: 'PageInfo'
  /** Cursor pointing to the end of the current page */
  endCursor?: Maybe<Scalars['String']['output']>
  /** Whether there are more items after the current page */
  hasNextPage: Scalars['Boolean']['output']
  /** Whether there are more items before the current page */
  hasPreviousPage: Scalars['Boolean']['output']
  /** Cursor pointing to the start of the current page */
  startCursor?: Maybe<Scalars['String']['output']>
}

export type RootQueryType = {
  __typename?: 'RootQueryType'
  /** Get the details of an error code returned from a Supabase service */
  error?: Maybe<Error>
  /** Get error codes that can potentially be returned by Supabase services */
  errors?: Maybe<ErrorCollection>
  /** Get the GraphQL schema for this endpoint */
  schema: Scalars['String']['output']
  /** Search the Supabase docs for content matching a query string */
  searchDocs?: Maybe<SearchResultCollection>
}

export type RootQueryTypeErrorArgs = {
  code: Scalars['String']['input']
  service: Service
}

export type RootQueryTypeErrorsArgs = {
  after?: InputMaybe<Scalars['String']['input']>
  before?: InputMaybe<Scalars['String']['input']>
  code?: InputMaybe<Scalars['String']['input']>
  first?: InputMaybe<Scalars['Int']['input']>
  last?: InputMaybe<Scalars['Int']['input']>
  service?: InputMaybe<Service>
}

export type RootQueryTypeSearchDocsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>
  query: Scalars['String']['input']
}

/** Document that matches a search query */
export type SearchResult = {
  /** The full content of the matching result */
  content?: Maybe<Scalars['String']['output']>
  /** The URL of the matching result */
  href?: Maybe<Scalars['String']['output']>
  /** The title of the matching result */
  title?: Maybe<Scalars['String']['output']>
}

/** A collection of search results containing content from Supabase docs */
export type SearchResultCollection = {
  __typename?: 'SearchResultCollection'
  /** A list of edges containing nodes in this collection */
  edges: Array<SearchResultEdge>
  /** The nodes in this collection, directly accessible */
  nodes: Array<SearchResult>
  /** The total count of items available in this collection */
  totalCount: Scalars['Int']['output']
}

/** An edge in a collection of SearchResults */
export type SearchResultEdge = {
  __typename?: 'SearchResultEdge'
  /** The SearchResult at the end of the edge */
  node: SearchResult
}

export enum Service {
  Auth = 'AUTH',
  Realtime = 'REALTIME',
  Storage = 'STORAGE',
}

/** A content chunk taken from a larger document in the Supabase docs */
export type Subsection = {
  __typename?: 'Subsection'
  /** The content of the subsection */
  content?: Maybe<Scalars['String']['output']>
  /** The URL of the subsection */
  href?: Maybe<Scalars['String']['output']>
  /** The title of the subsection */
  title?: Maybe<Scalars['String']['output']>
}

/** A collection of content chunks from a larger document in the Supabase docs. */
export type SubsectionCollection = {
  __typename?: 'SubsectionCollection'
  /** A list of edges containing nodes in this collection */
  edges: Array<SubsectionEdge>
  /** The nodes in this collection, directly accessible */
  nodes: Array<Subsection>
  /** The total count of items available in this collection */
  totalCount: Scalars['Int']['output']
}

/** An edge in a collection of Subsections */
export type SubsectionEdge = {
  __typename?: 'SubsectionEdge'
  /** The Subsection at the end of the edge */
  node: Subsection
}

/** A document describing how to troubleshoot an issue when using Supabase */
export type TroubleshootingGuide = SearchResult & {
  __typename?: 'TroubleshootingGuide'
  /** The full content of the troubleshooting guide */
  content?: Maybe<Scalars['String']['output']>
  /** The URL of the troubleshooting guide */
  href?: Maybe<Scalars['String']['output']>
  /** The title of the troubleshooting guide */
  title?: Maybe<Scalars['String']['output']>
}

export type ErrorCodeQueryQueryVariables = Exact<{
  code: Scalars['String']['input']
  service?: InputMaybe<Service>
}>

export type ErrorCodeQueryQuery = {
  __typename?: 'RootQueryType'
  errors?: {
    __typename?: 'ErrorCollection'
    nodes: Array<{ __typename?: 'Error'; code: string; service: Service; message?: string | null }>
  } | null
}

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: DocumentTypeDecoration<TResult, TVariables>['__apiType']
  private value: string
  public __meta__?: Record<string, any> | undefined

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value)
    this.value = value
    this.__meta__ = __meta__
  }

  toString(): string & DocumentTypeDecoration<TResult, TVariables> {
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
