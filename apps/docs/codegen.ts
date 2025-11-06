import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: './__generated__/schema.graphql',
  generates: {
    '__generated__/graphql.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
    },
  },
}

export default config
