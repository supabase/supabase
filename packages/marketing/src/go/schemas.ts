import { z } from 'zod'

// ----- Shared primitives -----

export const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().optional(),
  height: z.number().optional(),
})

export const ctaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(['primary', 'secondary']).optional().default('primary'),
})

// ----- Section schemas -----

export const videoSchema = z.object({
  src: z.string().min(1),
  poster: z.string().optional(),
})

export const heroSectionSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image: imageSchema.optional(),
  video: videoSchema.optional(),
  youtubeUrl: z.string().url().optional(),
  ctas: z.array(ctaSchema).optional(),
})

export const contentBlockSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
  image: imageSchema.optional(),
  icon: z.string().optional(),
})

export const contentBlocksSectionSchema = z.object({
  heading: z.string().optional(),
  blocks: z.array(contentBlockSchema).min(1),
  columns: z.enum(['2', '3']).optional().default('3'),
})

export const socialProofSectionSchema = z.object({
  heading: z.string().optional(),
  logos: z.array(imageSchema).optional(),
  testimonial: z
    .object({
      quote: z.string().min(1),
      author: z.string().min(1),
      role: z.string().optional(),
      avatar: imageSchema.optional(),
    })
    .optional(),
  stats: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
      })
    )
    .optional(),
})

export const textBodySectionSchema = z.object({
  content: z.string().min(1),
})

const sectionBase = {
  id: z.string().optional(),
  className: z.string().optional(),
}

export const singleColumnSectionSchema = z.object({
  ...sectionBase,
  type: z.literal('single-column'),
  title: z.string().min(1),
  description: z.string().optional(),
  children: z.any().optional(),
})

export const twoColumnSectionSchema = z.object({
  ...sectionBase,
  type: z.literal('two-column'),
  title: z.string().optional(),
  description: z.string().optional(),
  children: z.any().optional(),
})

export const threeColumnSectionSchema = z.object({
  ...sectionBase,
  type: z.literal('three-column'),
  title: z.string().optional(),
  description: z.string().optional(),
  children: z.any().optional(),
})

// ----- Form field schemas -----

const formFieldBase = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().optional().default(false),
  half: z.boolean().optional().default(false),
})

export const textFieldSchema = formFieldBase.extend({
  type: z.literal('text'),
})

export const emailFieldSchema = formFieldBase.extend({
  type: z.literal('email'),
})

export const textareaFieldSchema = formFieldBase.extend({
  type: z.literal('textarea'),
  rows: z.number().optional().default(4),
})

export const selectFieldSchema = formFieldBase.extend({
  type: z.literal('select'),
  options: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
})

export const formFieldSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  emailFieldSchema,
  textareaFieldSchema,
  selectFieldSchema,
])

// ----- Form CRM config schemas -----

export const hubspotFormConfigSchema = z.object({
  /**
   * HubSpot form GUID. The portal ID is read from HUBSPOT_PORTAL_ID env var.
   */
  formGuid: z.string().min(1),
  /**
   * Map each form field `name` to a HubSpot field name.
   * If omitted, the form field name is used as-is.
   * Example: { workEmail: 'email', companyName: 'company' }
   */
  fieldMap: z.record(z.string(), z.string()).optional(),
  /** Legal consent text for GDPR. */
  consent: z.string().optional(),
})

export const customerioFormConfigSchema = z.object({
  /**
   * Event name sent to Customer.io on submit.
   * Credentials are read from CUSTOMERIO_SITE_ID and CUSTOMERIO_API_KEY env vars.
   */
  event: z.string().min(1),
  /**
   * Map each form field `name` to a Customer.io profile attribute.
   * Fields listed here are added to the contact profile via `identify`.
   * Example: { workEmail: 'email', firstName: 'first_name' }
   */
  profileMap: z.record(z.string(), z.string()).optional(),
})

export const formCrmConfigSchema = z
  .object({
    hubspot: hubspotFormConfigSchema.optional(),
    customerio: customerioFormConfigSchema.optional(),
  })
  .refine((v) => v.hubspot || v.customerio, {
    message: 'At least one CRM provider (hubspot or customerio) must be configured',
  })

export const formSectionSchema = z.object({
  ...sectionBase,
  type: z.literal('form'),
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1),
  submitLabel: z.string().min(1),
  disclaimer: z.string().optional(),
  /** Message shown after a successful submission. Defaults to a generic thank-you message. */
  successMessage: z.string().optional(),
  /** URL to redirect the user to after a successful submission. When set, overrides successMessage. */
  successRedirect: z.string().optional(),
  /** CRM integration config. When provided, form submissions are sent to the configured providers. */
  crm: formCrmConfigSchema.optional(),
})

export const featureGridItemSchema = z.object({
  icon: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
})

export const featureGridSectionSchema = z.object({
  ...sectionBase,
  type: z.literal('feature-grid'),
  title: z.string().optional(),
  description: z.string().optional(),
  items: z.array(featureGridItemSchema).min(1).max(6),
})

export const metricItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})

export const metricsSectionSchema = z.object({
  ...sectionBase,
  type: z.literal('metrics'),
  items: z.array(metricItemSchema).min(1).max(5),
})

export const tweetsSectionSchema = z.object({
  ...sectionBase,
  type: z.literal('tweets'),
  title: z.string().optional(),
  description: z.string().optional(),
  ctas: z.array(ctaSchema).optional(),
})

// ----- Dynamic sections -----

export const goSectionSchema = z.discriminatedUnion('type', [
  singleColumnSectionSchema,
  twoColumnSectionSchema,
  threeColumnSectionSchema,
  formSectionSchema,
  featureGridSectionSchema,
  metricsSectionSchema,
  tweetsSectionSchema,
])

// ----- Page-level schemas -----

export const metadataSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  ogImage: z.string().optional(),
  noIndex: z.boolean().optional().default(true),
})

// ----- Page schemas -----

const goPageBaseSchema = z.object({
  slug: z.string().min(1),
  metadata: metadataSchema,
  hero: heroSectionSchema,
  sections: z.array(goSectionSchema).optional(),
  publishedAt: z.string().optional(),
})

export const leadGenPageSchema = goPageBaseSchema.extend({
  template: z.literal('lead-gen'),
})

export const thankYouPageSchema = goPageBaseSchema.extend({
  template: z.literal('thank-you'),
})

export const legalPageSchema = goPageBaseSchema.extend({
  template: z.literal('legal'),
  effectiveDate: z.string().optional(),
  body: z.string().min(1),
})

export const goPageSchema = z.discriminatedUnion('template', [
  leadGenPageSchema,
  thankYouPageSchema,
  legalPageSchema,
])

// ----- Inferred types -----

export type GoImage = z.infer<typeof imageSchema>
export type GoVideo = z.infer<typeof videoSchema>
export type GoCta = z.infer<typeof ctaSchema>
export type GoHeroSection = z.infer<typeof heroSectionSchema>
export type GoContentBlock = z.infer<typeof contentBlockSchema>
export type GoContentBlocksSection = z.infer<typeof contentBlocksSectionSchema>
export type GoSocialProofSection = z.infer<typeof socialProofSectionSchema>
export type GoTextBodySection = z.infer<typeof textBodySectionSchema>
export type GoSingleColumnSection = z.infer<typeof singleColumnSectionSchema>
export type GoTwoColumnSection = z.infer<typeof twoColumnSectionSchema>
export type GoThreeColumnSection = z.infer<typeof threeColumnSectionSchema>
export type GoFormField = z.infer<typeof formFieldSchema>
export type GoFormSection = z.infer<typeof formSectionSchema>
export type GoHubSpotFormConfig = z.infer<typeof hubspotFormConfigSchema>
export type GoCustomerIOFormConfig = z.infer<typeof customerioFormConfigSchema>
export type GoFormCrmConfig = z.infer<typeof formCrmConfigSchema>
export type GoFeatureGridItem = z.infer<typeof featureGridItemSchema>
export type GoFeatureGridSection = z.infer<typeof featureGridSectionSchema>
export type GoMetricItem = z.infer<typeof metricItemSchema>
export type GoMetricsSection = z.infer<typeof metricsSectionSchema>
export type GoTweetsSection = z.infer<typeof tweetsSectionSchema>
export type GoSection = z.infer<typeof goSectionSchema>
export type GoMetadata = z.infer<typeof metadataSchema>

export type GoPage = z.infer<typeof goPageSchema>
export type LeadGenPage = z.infer<typeof leadGenPageSchema>
export type ThankYouPage = z.infer<typeof thankYouPageSchema>
export type LegalPage = z.infer<typeof legalPageSchema>

/** Input type for registry files — fields with defaults are optional */
export type GoPageInput = z.input<typeof goPageSchema>
