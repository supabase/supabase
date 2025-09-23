import { z } from 'zod'

export const blockChunkSchema = z.object({
  name: z.string(),
  description: z.string(),
  component: z.any(),
  file: z.string(),
  code: z.string().optional(),
  container: z
    .object({
      className: z.string().nullish(),
    })
    .optional(),
})

const backendProviderValues = ['next-auth', 'supabase', 'auth0']

const isBackendProvider = (value: unknown): value is (typeof backendProviderValues)[number] =>
  backendProviderValues.includes(value as string)

export const registryEntrySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(z.string()),
  source: z.string().optional(),
  type: z.enum([
    'components:ui',
    'components:fragment',
    'components:component',
    'components:example',
    'components:block',
    'docs:example',
  ]),
  category: z.string().optional(),
  backendProviders: z.array(z.string()).optional(),
  subcategory: z.string().optional(),
  chunks: z.array(blockChunkSchema).optional(),
  // Optional path of file that is exported from a package
  optionalPath: z.string().optional(),
})

export const registrySchema = z.array(registryEntrySchema)

export type RegistryEntry = z.infer<typeof registryEntrySchema>

export type Registry = z.infer<typeof registrySchema>

export const blockSchema = registryEntrySchema.extend({
  type: z.literal('components:block'),
  style: z.enum(['default', 'new-york']),
  component: z.any(),
  container: z
    .object({
      height: z.string().optional(),
      className: z.string().nullish(),
    })
    .optional(),
  code: z.string(),
  backendProvidersCode: z.any().optional(),
  highlightedCode: z.string(),
})

export type Block = z.infer<typeof blockSchema>

export type BlockChunk = z.infer<typeof blockChunkSchema>
