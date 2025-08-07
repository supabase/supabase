import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

/** A reference document containing a description of a Supabase CLI command */
export type CliCommandReference = SearchResult & {
  __typename?: 'CLICommandReference';
  /** The content of the reference document, as text */
  content?: Maybe<Scalars['String']['output']>;
  /** The URL of the document */
  href?: Maybe<Scalars['String']['output']>;
  /** The title of the document */
  title?: Maybe<Scalars['String']['output']>;
};

/** A reference document containing a description of a function from a Supabase client library */
export type ClientLibraryFunctionReference = SearchResult & {
  __typename?: 'ClientLibraryFunctionReference';
  /** The content of the reference document, as text */
  content?: Maybe<Scalars['String']['output']>;
  /** The URL of the document */
  href?: Maybe<Scalars['String']['output']>;
  /** The programming language for which the function is written */
  language: Language;
  /** The name of the function or method */
  methodName?: Maybe<Scalars['String']['output']>;
  /** The title of the document */
  title?: Maybe<Scalars['String']['output']>;
};

/** An error returned by a Supabase service */
export type Error = {
  __typename?: 'Error';
  /** The unique code identifying the error. The code is stable, and can be used for string matching during error handling. */
  code: Scalars['String']['output'];
  /** The HTTP status code returned with this error. */
  httpStatusCode?: Maybe<Scalars['Int']['output']>;
  /** A human-readable message describing the error. The message is not stable, and should not be used for string matching during error handling. Use the code instead. */
  message?: Maybe<Scalars['String']['output']>;
  /** The Supabase service that returns this error. */
  service: Service;
};

/** A collection of Errors */
export type ErrorCollection = {
  __typename?: 'ErrorCollection';
  /** A list of edges containing nodes in this collection */
  edges: Array<ErrorEdge>;
  /** The nodes in this collection, directly accessible */
  nodes: Array<Error>;
  /** Pagination information */
  pageInfo: PageInfo;
  /** The total count of items available in this collection */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a collection of Errors */
export type ErrorEdge = {
  __typename?: 'ErrorEdge';
  /** A cursor for use in pagination */
  cursor: Scalars['String']['output'];
  /** The Error at the end of the edge */
  node: Error;
};

/** A document containing content from the Supabase docs. This is a guide, which might describe a concept, or explain the steps for using or implementing a feature. */
export type Guide = SearchResult & {
  __typename?: 'Guide';
  /** The full content of the document, including all subsections (both those matching and not matching any query string) and possibly more content */
  content?: Maybe<Scalars['String']['output']>;
  /** The URL of the document */
  href?: Maybe<Scalars['String']['output']>;
  /** The subsections of the document. If the document is returned from a search match, only matching content chunks are returned. For the full content of the original document, use the content field in the parent Guide. */
  subsections?: Maybe<SubsectionCollection>;
  /** The title of the document */
  title?: Maybe<Scalars['String']['output']>;
};

export enum Language {
  Csharp = 'CSHARP',
  Dart = 'DART',
  Javascript = 'JAVASCRIPT',
  Kotlin = 'KOTLIN',
  Python = 'PYTHON',
  Swift = 'SWIFT'
}

/** A reference document containing a description of a Supabase Management API endpoint */
export type ManagementApiReference = SearchResult & {
  __typename?: 'ManagementApiReference';
  /** The content of the reference document, as text */
  content?: Maybe<Scalars['String']['output']>;
  /** The URL of the document */
  href?: Maybe<Scalars['String']['output']>;
  /** The title of the document */
  title?: Maybe<Scalars['String']['output']>;
};

/** Pagination information for a collection */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** Cursor pointing to the end of the current page */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** Whether there are more items after the current page */
  hasNextPage: Scalars['Boolean']['output'];
  /** Whether there are more items before the current page */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** Cursor pointing to the start of the current page */
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type RootQueryType = {
  __typename?: 'RootQueryType';
  /** Get the details of an error code returned from a Supabase service */
  error?: Maybe<Error>;
  /** Get error codes that can potentially be returned by Supabase services */
  errors?: Maybe<ErrorCollection>;
  /** Get the GraphQL schema for this endpoint */
  schema: Scalars['String']['output'];
  /** Search the Supabase docs for content matching a query string */
  searchDocs?: Maybe<SearchResultCollection>;
};


export type RootQueryTypeErrorArgs = {
  code: Scalars['String']['input'];
  service: Service;
};


export type RootQueryTypeErrorsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  code?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  service?: InputMaybe<Service>;
};


export type RootQueryTypeSearchDocsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

/** Document that matches a search query */
export type SearchResult = {
  /** The full content of the matching result */
  content?: Maybe<Scalars['String']['output']>;
  /** The URL of the matching result */
  href?: Maybe<Scalars['String']['output']>;
  /** The title of the matching result */
  title?: Maybe<Scalars['String']['output']>;
};

/** A collection of search results containing content from Supabase docs */
export type SearchResultCollection = {
  __typename?: 'SearchResultCollection';
  /** A list of edges containing nodes in this collection */
  edges: Array<SearchResultEdge>;
  /** The nodes in this collection, directly accessible */
  nodes: Array<SearchResult>;
  /** The total count of items available in this collection */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a collection of SearchResults */
export type SearchResultEdge = {
  __typename?: 'SearchResultEdge';
  /** The SearchResult at the end of the edge */
  node: SearchResult;
};

export enum Service {
  Auth = 'AUTH',
  Realtime = 'REALTIME',
  Storage = 'STORAGE'
}

/** A content chunk taken from a larger document in the Supabase docs */
export type Subsection = {
  __typename?: 'Subsection';
  /** The content of the subsection */
  content?: Maybe<Scalars['String']['output']>;
  /** The URL of the subsection */
  href?: Maybe<Scalars['String']['output']>;
  /** The title of the subsection */
  title?: Maybe<Scalars['String']['output']>;
};

/** A collection of content chunks from a larger document in the Supabase docs. */
export type SubsectionCollection = {
  __typename?: 'SubsectionCollection';
  /** A list of edges containing nodes in this collection */
  edges: Array<SubsectionEdge>;
  /** The nodes in this collection, directly accessible */
  nodes: Array<Subsection>;
  /** The total count of items available in this collection */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a collection of Subsections */
export type SubsectionEdge = {
  __typename?: 'SubsectionEdge';
  /** The Subsection at the end of the edge */
  node: Subsection;
};

/** A document describing how to troubleshoot an issue when using Supabase */
export type TroubleshootingGuide = SearchResult & {
  __typename?: 'TroubleshootingGuide';
  /** The full content of the troubleshooting guide */
  content?: Maybe<Scalars['String']['output']>;
  /** The URL of the troubleshooting guide */
  href?: Maybe<Scalars['String']['output']>;
  /** The title of the troubleshooting guide */
  title?: Maybe<Scalars['String']['output']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;


/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = {
  SearchResult: ( CliCommandReference ) | ( ClientLibraryFunctionReference ) | ( Guide ) | ( ManagementApiReference ) | ( TroubleshootingGuide );
};

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CLICommandReference: ResolverTypeWrapper<CliCommandReference>;
  ClientLibraryFunctionReference: ResolverTypeWrapper<ClientLibraryFunctionReference>;
  Error: ResolverTypeWrapper<Error>;
  ErrorCollection: ResolverTypeWrapper<ErrorCollection>;
  ErrorEdge: ResolverTypeWrapper<ErrorEdge>;
  Guide: ResolverTypeWrapper<Guide>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Language: Language;
  ManagementApiReference: ResolverTypeWrapper<ManagementApiReference>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  RootQueryType: ResolverTypeWrapper<{}>;
  SearchResult: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['SearchResult']>;
  SearchResultCollection: ResolverTypeWrapper<Omit<SearchResultCollection, 'edges' | 'nodes'> & { edges: Array<ResolversTypes['SearchResultEdge']>, nodes: Array<ResolversTypes['SearchResult']> }>;
  SearchResultEdge: ResolverTypeWrapper<Omit<SearchResultEdge, 'node'> & { node: ResolversTypes['SearchResult'] }>;
  Service: Service;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subsection: ResolverTypeWrapper<Subsection>;
  SubsectionCollection: ResolverTypeWrapper<SubsectionCollection>;
  SubsectionEdge: ResolverTypeWrapper<SubsectionEdge>;
  TroubleshootingGuide: ResolverTypeWrapper<TroubleshootingGuide>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  CLICommandReference: CliCommandReference;
  ClientLibraryFunctionReference: ClientLibraryFunctionReference;
  Error: Error;
  ErrorCollection: ErrorCollection;
  ErrorEdge: ErrorEdge;
  Guide: Guide;
  Int: Scalars['Int']['output'];
  ManagementApiReference: ManagementApiReference;
  PageInfo: PageInfo;
  RootQueryType: {};
  SearchResult: ResolversInterfaceTypes<ResolversParentTypes>['SearchResult'];
  SearchResultCollection: Omit<SearchResultCollection, 'edges' | 'nodes'> & { edges: Array<ResolversParentTypes['SearchResultEdge']>, nodes: Array<ResolversParentTypes['SearchResult']> };
  SearchResultEdge: Omit<SearchResultEdge, 'node'> & { node: ResolversParentTypes['SearchResult'] };
  String: Scalars['String']['output'];
  Subsection: Subsection;
  SubsectionCollection: SubsectionCollection;
  SubsectionEdge: SubsectionEdge;
  TroubleshootingGuide: TroubleshootingGuide;
};

export type CliCommandReferenceResolvers<ContextType = any, ParentType extends ResolversParentTypes['CLICommandReference'] = ResolversParentTypes['CLICommandReference']> = {
  content?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  href?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ClientLibraryFunctionReferenceResolvers<ContextType = any, ParentType extends ResolversParentTypes['ClientLibraryFunctionReference'] = ResolversParentTypes['ClientLibraryFunctionReference']> = {
  content?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  href?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  language?: Resolver<ResolversTypes['Language'], ParentType, ContextType>;
  methodName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['Error'] = ResolversParentTypes['Error']> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  httpStatusCode?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  service?: Resolver<ResolversTypes['Service'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ErrorCollectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ErrorCollection'] = ResolversParentTypes['ErrorCollection']> = {
  edges?: Resolver<Array<ResolversTypes['ErrorEdge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Error']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ErrorEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ErrorEdge'] = ResolversParentTypes['ErrorEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Error'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GuideResolvers<ContextType = any, ParentType extends ResolversParentTypes['Guide'] = ResolversParentTypes['Guide']> = {
  content?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  href?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subsections?: Resolver<Maybe<ResolversTypes['SubsectionCollection']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ManagementApiReferenceResolvers<ContextType = any, ParentType extends ResolversParentTypes['ManagementApiReference'] = ResolversParentTypes['ManagementApiReference']> = {
  content?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  href?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RootQueryTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['RootQueryType'] = ResolversParentTypes['RootQueryType']> = {
  error?: Resolver<Maybe<ResolversTypes['Error']>, ParentType, ContextType, RequireFields<RootQueryTypeErrorArgs, 'code' | 'service'>>;
  errors?: Resolver<Maybe<ResolversTypes['ErrorCollection']>, ParentType, ContextType, Partial<RootQueryTypeErrorsArgs>>;
  schema?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  searchDocs?: Resolver<Maybe<ResolversTypes['SearchResultCollection']>, ParentType, ContextType, RequireFields<RootQueryTypeSearchDocsArgs, 'query'>>;
};

export type SearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SearchResult'] = ResolversParentTypes['SearchResult']> = {
  __resolveType: TypeResolveFn<'CLICommandReference' | 'ClientLibraryFunctionReference' | 'Guide' | 'ManagementApiReference' | 'TroubleshootingGuide', ParentType, ContextType>;
  content?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  href?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type SearchResultCollectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['SearchResultCollection'] = ResolversParentTypes['SearchResultCollection']> = {
  edges?: Resolver<Array<ResolversTypes['SearchResultEdge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['SearchResult']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SearchResultEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['SearchResultEdge'] = ResolversParentTypes['SearchResultEdge']> = {
  node?: Resolver<ResolversTypes['SearchResult'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubsectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subsection'] = ResolversParentTypes['Subsection']> = {
  content?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  href?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubsectionCollectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['SubsectionCollection'] = ResolversParentTypes['SubsectionCollection']> = {
  edges?: Resolver<Array<ResolversTypes['SubsectionEdge']>, ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['Subsection']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubsectionEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['SubsectionEdge'] = ResolversParentTypes['SubsectionEdge']> = {
  node?: Resolver<ResolversTypes['Subsection'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TroubleshootingGuideResolvers<ContextType = any, ParentType extends ResolversParentTypes['TroubleshootingGuide'] = ResolversParentTypes['TroubleshootingGuide']> = {
  content?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  href?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  CLICommandReference?: CliCommandReferenceResolvers<ContextType>;
  ClientLibraryFunctionReference?: ClientLibraryFunctionReferenceResolvers<ContextType>;
  Error?: ErrorResolvers<ContextType>;
  ErrorCollection?: ErrorCollectionResolvers<ContextType>;
  ErrorEdge?: ErrorEdgeResolvers<ContextType>;
  Guide?: GuideResolvers<ContextType>;
  ManagementApiReference?: ManagementApiReferenceResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  RootQueryType?: RootQueryTypeResolvers<ContextType>;
  SearchResult?: SearchResultResolvers<ContextType>;
  SearchResultCollection?: SearchResultCollectionResolvers<ContextType>;
  SearchResultEdge?: SearchResultEdgeResolvers<ContextType>;
  Subsection?: SubsectionResolvers<ContextType>;
  SubsectionCollection?: SubsectionCollectionResolvers<ContextType>;
  SubsectionEdge?: SubsectionEdgeResolvers<ContextType>;
  TroubleshootingGuide?: TroubleshootingGuideResolvers<ContextType>;
};

