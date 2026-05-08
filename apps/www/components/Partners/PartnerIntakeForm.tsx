import { MarketingForm, type MarketingFormCrmConfig, type MarketingFormField } from 'marketing'

/**
 * `partner_type` controls which conditional sections render. Values are kept
 * stable (lowercase, snake-case) because they're referenced in `showWhen`
 * rules below and in the Notion `sendWhen` gating in `partnerIntakeCrm`.
 */
const PARTNER_TYPES = {
  technology: 'technology',
  solutions: 'solutions',
  startup: 'startup',
  whitelabel: 'whitelabel',
  events: 'events',
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
    value: PARTNER_TYPES.startup,
    label: 'Startup Partner — VC, accelerator, education, or community program',
  },
  {
    value: PARTNER_TYPES.whitelabel,
    label: 'Whitelabel — platform provisioning Supabase backends for your users',
  },
  {
    value: PARTNER_TYPES.events,
    label: 'Hackathon / Events — sponsorship, hackathons, student events',
  },
  {
    value: PARTNER_TYPES.other,
    label: 'Other',
  },
]

const fields: MarketingFormField[] = [
  // ----- General -----
  { name: 'first_name', label: 'First name', type: 'text', required: true, half: true },
  { name: 'last_name', label: 'Last name', type: 'text', required: true, half: true },
  { name: 'email', label: 'Work email', type: 'email', required: true, half: true },
  { name: 'company_name', label: 'Company name', type: 'text', required: true, half: true },
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

  // ----- Startup Partners -----
  {
    name: 'program_type',
    label: 'Describe your program',
    type: 'select',
    required: true,
    placeholder: 'Select a program type',
    options: [
      { value: 'vc', label: 'VC' },
      { value: 'accelerator', label: 'Accelerator' },
      { value: 'ecosystem', label: 'Ecosystem' },
      { value: 'education', label: 'Education' },
    ],
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.startup },
  },
  {
    name: 'annual_startup_count',
    label: 'How many startups do you work with annually?',
    type: 'text',
    required: true,
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.startup },
  },
  {
    name: 'vertical_geo_focus',
    label: 'Any specific vertical or geographic focus?',
    type: 'textarea',
    rows: 3,
    showWhen: { field: 'partner_type', equals: PARTNER_TYPES.startup },
  },

  // ----- General trailing field -----
  {
    name: 'additional_details',
    label: 'Any other details you’d like us to know?',
    type: 'textarea',
    rows: 4,
  },
]

/**
 * CRM fan-out for the partner intake form.
 *
 * - HubSpot receives every submission (the canonical destination).
 * - Notion receives only Technology Partner submissions, syncing them to the
 *   Tech Partner Intake database used by the partnerships team for triage.
 *
 * `formGuid` and `database_id` are placeholders — replace before shipping.
 */
export const partnerIntakeCrm: MarketingFormCrmConfig = {
  hubspot: {
    // TODO(DEBR-271): replace with the real partner-intake HubSpot form GUID.
    formGuid: '00000000-0000-0000-0000-000000000000',
  },
  notion: {
    // TODO(DEBR-271): replace with the Tech Partner Intake Notion database ID.
    database_id: '00000000000000000000000000000000',
    sendWhen: { field: 'partner_type', equals: PARTNER_TYPES.technology },
  },
}

const successMessage =
  'We’ve received your submission. Our team reviews every application — if there’s a good fit with the program you selected, we’ll be in touch to discuss next steps.'

interface PartnerIntakeFormProps {
  className?: string
}

export default function PartnerIntakeForm({ className }: PartnerIntakeFormProps) {
  return (
    <MarketingForm
      className={className}
      fields={fields}
      submitLabel="Submit application"
      crm={partnerIntakeCrm}
      successMessage={successMessage}
    />
  )
}
