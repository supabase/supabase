import { z } from 'zod'

const contentListingIconKindSchema = z.enum([
  'braces',
  'otlp',
  'datadog',
  'grafana',
  'cloud',
  'sentry',
  'axiom',
  'last9',
  'server',
])

const contentListingIconChipSchema = z.object({
  kind: contentListingIconKindSchema,
  color: z.string().min(1),
  bg: z.string().min(1),
})

export const contentListingIconSchema = z.union([z.string().min(1), contentListingIconChipSchema])

export const contentListingItemSchema = z.object({
  title: z.string().min(1),
  href: z.string().min(1),
  description: z.string().min(1),
  icon: contentListingIconSchema.optional(),
  hasLightIcon: z.boolean().optional(),
  badge: z.string().min(1).optional(),
})

export const contentListingGroupTypeSchema = z.enum(['list', 'grid'])

export const contentListingGridColumnsSchema = z.union([z.literal(2), z.literal(3), z.literal(4)])

export const contentListingHeadingLevelSchema = z.enum(['h2', 'h3', 'h4'])

export const contentListingGroupSchema = z.object({
  id: z.string().min(1),
  heading: z.string().min(1).optional(),
  headingLevel: contentListingHeadingLevelSchema.optional(),
  description: z.string().optional(),
  type: contentListingGroupTypeSchema.optional(),
  columns: contentListingGridColumnsSchema.optional(),
  items: z.array(contentListingItemSchema).min(1),
})
