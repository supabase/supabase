export const pgGraphqlKeys = {
  schemaComment: (projectRef: string | undefined, schema: string) =>
    ['projects', projectRef, 'pg-graphql', 'schema-comment', schema] as const,
}
