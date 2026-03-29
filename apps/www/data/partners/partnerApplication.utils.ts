import { z } from 'zod'

// Partner categories available for selection
export const PARTNER_CATEGORIES = [
  'Analytics',
  'Auth',
  'Automation',
  'Caching',
  'CMS',
  'Data Platform',
  'Database',
  'DevTools',
  'ETL',
  'IDE',
  'Infra Automation',
  'Low-Code',
  'Messaging',
  'Monitoring',
  'Observability',
  'Orchestration',
  'ORM',
  'Payment Processing',
  'Replication',
  'Search',
  'Serverless',
  'Other',
] as const

// partner_contacts fields
export const partnerContactSchema = z.object({
  first: z.string().min(1, 'First name is required'),
  last: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().min(1, 'Company name is required'),
  country: z.string().min(1, 'Country is required'),
  website: z.string().url('Please enter a valid URL'),
  phone: z.string().optional(),
  title: z.string().optional(),
  size: z.number().int().positive().optional(),
  details: z.string().optional(),
})

// partners fields
export const partnerSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .max(50, 'Slug must be 50 characters or less'),
  title: z.string().min(1, 'Integration title is required').max(100),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  category: z.string().min(1, 'Category is required'),
  developer: z.string().min(1, 'Developer/Company name is required'),
  logo: z.string().optional(), // URL is generated after file upload
  overview: z.string().min(1, 'Overview is required'),
  website: z.string().url('Please enter a valid website URL'),
  docs: z.string().url('Please enter a valid docs URL').optional().or(z.literal('')),
  video: z.string().optional(),
  call_to_action_link: z.string().url().optional().or(z.literal('')),
})

// Combined schema for the full application form
export const partnerApplicationSchema = z.object({
  // Contact information
  contact: partnerContactSchema,
  // Integration information
  partner: partnerSchema,
  // Captcha token
  captchaToken: z.string().min(1, 'Please complete the captcha verification'),
})

export type PartnerContact = z.infer<typeof partnerContactSchema>
export type Partner = z.infer<typeof partnerSchema>
export type PartnerApplication = z.infer<typeof partnerApplicationSchema>

// API response types
export interface PartnerApplicationResponse {
  success: boolean
  message: string
  partnerId?: number
  contactId?: number
}

export interface SlugCheckResponse {
  available: boolean
}

export interface LogoUploadResponse {
  signedUrl: string
  path: string
  publicUrl: string
  token: string
}
