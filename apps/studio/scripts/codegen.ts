import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'scripts/schema.graphql',
  documents: ['data/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    'data/graphql/': {
      preset: 'client',
      config: {
        documentMode: 'string',
      },
    },
  },
}

export default config
