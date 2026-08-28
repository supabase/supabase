import type { MarketingFormField } from 'marketing/forms'

/**
 * Field data for PartnerIntakeForm, split into its own module (no `'use
 * client'`, no runtime import of `marketing/forms`) so it can be imported by
 * PartnerIntakeForm.sync.test.ts without pulling in MarketingForm's
 * `'use server'` submission action and its `server-only` guard.
 */

/**
 * `partner_type` controls which conditional sections render. Values match
 * HubSpot's `type_of_partners` picklist option values exactly (not our own
 * slugs) because `staticFormCrm.ts` forwards this field straight through to
 * HubSpot with no value translation — only the field *name* is mapped there.
 * They're also referenced in `showWhen` rules below, in CTA query-string
 * links (`data/partners/index.tsx`, URL-encoded since these contain spaces),
 * and in the Notion `sendWhen` gating TODO in `apps/www/lib/staticFormCrm.ts`.
 *
 * HubSpot has 5 live options here, not 4: `marketplace` ("Technology
 * Partners") and `technology` ("Tech Partner") are two distinct, currently
 * selectable values — not a legacy duplicate — that happen to gate the same
 * downstream fields (see the `in: [...]` showWhen rules below).
 */
export const PARTNER_TYPES = {
  marketplace: 'Technology Partners',
  technology: 'Tech Partner',
  solutions: 'Solution Partners',
  startup: 'Startup Partners',
  other: 'Other',
} as const

const partnerTypeOptions = [
  {
    value: PARTNER_TYPES.marketplace,
    label: 'Marketplace Partner — listing a tool that plugs into an existing Supabase project',
  },
  {
    value: PARTNER_TYPES.technology,
    label: 'Technology Partner — building a technical integration',
  },
  {
    value: PARTNER_TYPES.solutions,
    label: 'Solution Partner — agency, consultancy, or service provider',
  },
  {
    value: PARTNER_TYPES.startup,
    label: 'Startup Partner — VC, accelerator, or ecosystem program',
  },
  {
    value: PARTNER_TYPES.other,
    label: 'Other',
  },
]

export const fields: MarketingFormField[] = [
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
    name: 'company_size',
    label: 'How many people work at your company?',
    type: 'select',
    required: true,
    placeholder: 'Select a range',
    options: [
      { value: '1-5', label: '1-5' },
      { value: '6-10', label: '6-10' },
      { value: '21-50', label: '21-50' },
      { value: '51-100', label: '51-100' },
      { value: '100+', label: '100+' },
    ],
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
  // Gated on BOTH the Marketplace and Technology Partner values — HubSpot
  // shows this whole section for either (see the PARTNER_TYPES comment
  // above).
  {
    name: 'solution_product_name',
    label: 'Product or solution name',
    type: 'text',
    required: true,
    showWhen: { field: 'partner_type', in: [PARTNER_TYPES.marketplace, PARTNER_TYPES.technology] },
  },
  {
    name: 'integration_problem_description',
    label: 'What problem does your integration solve for a Supabase customer?',
    type: 'textarea',
    required: true,
    showWhen: { field: 'partner_type', in: [PARTNER_TYPES.marketplace, PARTNER_TYPES.technology] },
  },
  {
    name: 'integration_docs_link',
    label: 'Link to integration docs',
    type: 'url',
    required: true,
    placeholder: 'https://',
    showWhen: { field: 'partner_type', in: [PARTNER_TYPES.marketplace, PARTNER_TYPES.technology] },
  },
  {
    name: 'integration_readiness',
    label: 'Where are you in the integration journey?',
    type: 'select',
    required: true,
    placeholder: 'Select an option',
    // Option values match HubSpot's `integration_readiness` picklist exactly
    // (including its straight apostrophes) — this field forwards to HubSpot
    // by name with no value translation, so the value sent must be one of
    // HubSpot's registered options.
    options: [
      {
        value: 'Our product already works with Supabase (users connect today)',
        label: 'Our product already works with Supabase (users connect today)',
      },
      {
        value: 'We have a working integration or proof of concept',
        label: 'We have a working integration or proof of concept',
      },
      {
        value: "We've scoped the integration but haven't built it yet",
        label: "We've scoped the integration but haven't built it yet",
      },
      {
        value: "We're exploring, no integration work has started",
        label: "We're exploring, no integration work has started",
      },
    ],
    showWhen: { field: 'partner_type', in: [PARTNER_TYPES.marketplace, PARTNER_TYPES.technology] },
  },
  {
    name: 'partnerships_website',
    label: 'Partnership or affiliate program page (optional)',
    type: 'url',
    placeholder: 'https://',
    showWhen: { field: 'partner_type', in: [PARTNER_TYPES.marketplace, PARTNER_TYPES.technology] },
  },
  // ----- Solution Partners -----
  // As with `integration_readiness` above, every option `value` below
  // matches HubSpot's picklist exactly since these fields forward straight
  // through with no value translation.
  {
    name: 'services_offered',
    label: 'Which services do you offer?',
    type: 'checkbox-group',
    required: true,
    options: [
      { value: 'Build & implementation', label: 'Build & implementation' },
      { value: 'Database migration', label: 'Database migration' },
      { value: 'Auth & identity migration', label: 'Auth & identity migration' },
      { value: 'Technical consulting & advisory', label: 'Technical consulting & advisory' },
      { value: 'Managed services', label: 'Managed services' },
      { value: 'Reseller & VAR', label: 'Reseller & VAR' },
      { value: 'Other', label: 'Other' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.solutions },
  },
  {
    name: 'operating_regions',
    label: 'Where do you operate?',
    type: 'checkbox-group',
    required: true,
    options: [
      { value: 'North America', label: 'North America' },
      { value: 'EMEA', label: 'EMEA' },
      { value: 'APAC', label: 'APAC' },
      { value: 'LATAM', label: 'LATAM' },
      { value: 'Global', label: 'Global' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.solutions },
  },
  {
    name: 'supabase_postgres_experience',
    label: 'How much Supabase / Postgres experience does your team have?',
    type: 'select',
    placeholder: 'Select an option',
    options: [
      {
        value: 'Yes — active client projects on Supabase',
        label: 'Yes — active client projects on Supabase',
      },
      {
        value: 'Yes — internal or personal projects only',
        label: 'Yes — internal or personal projects only',
      },
      {
        value: 'Postgres experience but not Supabase yet',
        label: 'Postgres experience but not Supabase yet',
      },
      { value: 'No experience yet', label: 'No experience yet' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.solutions },
  },
  {
    name: 'client_types',
    label: 'Who do you typically serve?',
    type: 'checkbox-group',
    required: true,
    options: [
      { value: 'Startups', label: 'Startups' },
      { value: 'SMB', label: 'SMB' },
      { value: 'Mid-market', label: 'Mid-market' },
      { value: 'Enterprise', label: 'Enterprise' },
      { value: 'Mixed', label: 'Mixed' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.solutions },
  },

  // ----- Startup Partners -----
  {
    name: 'startup_program_type',
    label: 'What best describes your program?',
    type: 'select',
    placeholder: 'Select an option',
    options: [
      { value: 'VC', label: 'VC' },
      { value: 'Accelerator', label: 'Accelerator' },
      { value: 'Ecosystem', label: 'Ecosystem' },
      { value: 'Education', label: 'Education' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.startup },
  },
  {
    name: 'startup_stage',
    label: 'What stage of startups do you typically work with?',
    type: 'text',
    required: true,
    description: 'Bootstrapped, pre-seed/seed, Series A–C, or Series D and beyond',
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.startup },
  },
  {
    name: 'startup_capital_deployment',
    label: 'Do you deploy capital into your portfolio or cohort? If so, how much?',
    type: 'text',
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.startup },
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
