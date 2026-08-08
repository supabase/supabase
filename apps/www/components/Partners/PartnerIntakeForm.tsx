'use client'

import { MarketingForm, type MarketingFormField } from 'marketing/forms'
import { parseAsString, useQueryState } from 'nuqs'

/**
 * `partner_type` controls which conditional sections render. Values are kept
 * stable (lowercase, snake-case) because they're referenced in `showWhen`
 * rules below and in the Notion `sendWhen` gating in
 * `apps/www/lib/staticFormCrm.ts`.
 */
export const PARTNER_TYPES = {
  technology: 'technology',
  solutions: 'solutions',
  other: 'other',
} as const

const partnerTypeOptions = [
  {
    value: PARTNER_TYPES.technology,
    label: 'Technology Partner — building a technical integration',
  },
  {
    value: PARTNER_TYPES.solutions,
    label: 'Solution Partner — agency, consultancy, or service provider',
  },
  {
    value: PARTNER_TYPES.other,
    label: 'Other',
  },
]

const fields: MarketingFormField[] = [
  // ----- General -----
  {
    name: 'first_name',
    label: 'First name',
    type: 'text',
    required: true,
    half: true,
    placeholder: 'John',
  },
  {
    name: 'last_name',
    label: 'Last name',
    type: 'text',
    required: true,
    half: true,
    placeholder: 'Doe',
  },
  {
    name: 'email',
    label: 'Work email',
    type: 'email',
    required: true,
    half: true,
    placeholder: 'john.doe@company.com',
  },
  {
    name: 'company_name',
    label: 'Company name',
    type: 'text',
    required: true,
    half: true,
    placeholder: 'Company Inc.',
  },
  {
    name: 'company_website',
    label: 'Company website',
    type: 'url',
    required: true,
    placeholder: 'https://',
  },
  {
    name: 'partner_type',
    label: 'What type of partnership are you interested in?',
    type: 'select',
    required: true,
    placeholder: 'Select a partnership type',
    options: partnerTypeOptions,
  },

  // ----- Technology Partners -----
  {
    name: 'solution_product_name',
    label: 'Product or solution name',
    type: 'text',
    required: true,
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.technology },
  },
  {
    name: 'integration_problem_description',
    label: 'What problem does your integration solve for a Supabase customer?',
    type: 'textarea',
    required: true,
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.technology },
  },
  {
    name: 'integration_docs_link',
    label: 'Link to integration docs (optional)',
    type: 'url',
    placeholder: 'https://',
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.technology },
  },
  {
    name: 'integration_readiness',
    label: 'Where are you in the integration journey?',
    type: 'select',
    required: true,
    placeholder: 'Select an option',
    options: [
      {
        value: 'live',
        label: 'Our product already works with Supabase (users connect today)',
      },
      { value: 'working_poc', label: 'We have a working integration or proof of concept' },
      { value: 'scoped', label: 'We’ve scoped the integration but haven’t built it yet' },
      { value: 'exploring', label: 'We’re exploring, no integration work has started' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.technology },
  },
  {
    name: 'partnerships_team',
    label: 'How is partnerships staffed at your company?',
    type: 'select',
    required: true,
    placeholder: 'Select an option',
    options: [
      { value: 'dedicated', label: 'We have a dedicated partnerships or BD team' },
      { value: 'sales_gtm', label: 'Our sales or go-to-market team owns partnerships' },
      { value: 'founder_exec', label: 'A founder or exec is the main point of contact' },
      { value: 'no_process', label: 'We don’t have a formal process yet' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.technology },
  },
  {
    name: 'partnership_management_model',
    label: 'How does your company typically manage technology partnerships?',
    type: 'select',
    required: true,
    placeholder: 'Select an option',
    options: [
      { value: 'rev_share', label: 'Revenue share (%) / marketplace listing' },
      { value: 'usage_split', label: 'Usage / consumption-based split' },
      { value: 'co_marketing', label: 'Co-marketing and referrals' },
      { value: 'open', label: 'Open to discussion' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.technology },
  },
  {
    name: 'integration_timeline',
    label: 'When are you looking to launch?',
    type: 'select',
    placeholder: 'Select a timeline',
    options: [
      { value: 'asap', label: 'ASAP (within 30 days)' },
      { value: 'this_quarter', label: 'This quarter' },
      { value: 'next_quarter', label: 'Next quarter' },
      { value: 'no_timeline', label: 'No specific timeline' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.technology },
  },

  // ----- Solution Partners -----
  {
    name: 'services_offered',
    label: 'Which services do you offer?',
    type: 'checkbox-group',
    required: true,
    options: [
      { value: 'build_implementation', label: 'Build & implementation' },
      { value: 'database_migration', label: 'Database migration' },
      { value: 'auth_migration', label: 'Auth & identity migration' },
      { value: 'consulting', label: 'Technical consulting & advisory' },
      { value: 'managed_services', label: 'Managed services' },
      { value: 'reseller', label: 'Reseller & VAR' },
      { value: 'other', label: 'Other' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.solutions },
  },
  {
    name: 'operating_regions',
    label: 'Where do you operate?',
    type: 'checkbox-group',
    required: true,
    options: [
      { value: 'north_america', label: 'North America' },
      { value: 'emea', label: 'EMEA' },
      { value: 'apac', label: 'APAC' },
      { value: 'latam', label: 'LATAM' },
      { value: 'global', label: 'Global' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.solutions },
  },
  {
    name: 'supabase_postgres_experience',
    label: 'How much Supabase / Postgres experience does your team have?',
    type: 'select',
    placeholder: 'Select an option',
    options: [
      { value: 'active_clients', label: 'Yes — active client projects on Supabase' },
      { value: 'internal_only', label: 'Yes — internal or personal projects only' },
      { value: 'postgres_only', label: 'Postgres experience but not Supabase yet' },
      { value: 'none', label: 'No experience yet' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.solutions },
  },
  {
    name: 'client_types',
    label: 'Who do you typically serve?',
    type: 'checkbox-group',
    required: true,
    options: [
      { value: 'startups', label: 'Startups' },
      { value: 'smb', label: 'SMB' },
      { value: 'mid_market', label: 'Mid-market' },
      { value: 'enterprise', label: 'Enterprise' },
      { value: 'mixed', label: 'Mixed' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.solutions },
  },

  // ----- General trailing field -----
  {
    name: 'additional_details',
    label: 'Any other details you’d like us to know?',
    type: 'textarea',
    rows: 4,
    placeholder: 'Tell us more about your project, your team, and your goals for this partnership.',
  },
]

const successMessage =
  'We’ve received your submission. Our team reviews every application — if there’s a good fit with the program you selected, we’ll be in touch to discuss next steps.'

interface PartnerIntakeFormProps {
  className?: string
}

export default function PartnerIntakeForm({ className }: PartnerIntakeFormProps) {
  const [partnerType] = useQueryState('partner_type', parseAsString.withDefault(''))

  return (
    <MarketingForm
      // forces a remount so the partnerType preset
      // applies whenever the URL value changes.
      key={partnerType}
      className={className}
      fields={fields}
      submitLabel="Submit application"
      formRef={{ slug: 'partners', formId: 'become-a-partner' }}
      successMessage={successMessage}
      initialValues={partnerType ? { partner_type: partnerType } : undefined}
    />
  )
}
