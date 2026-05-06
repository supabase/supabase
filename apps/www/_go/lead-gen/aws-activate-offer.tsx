import { MarketingForm } from 'marketing'
import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'aws-activate-offer',
  metadata: {
    title: 'Get $300 in Supabase credits through AWS Activate',
    description:
      'Exclusively for VC-backed startups accessing Supabase through AWS Activate. Apply to receive $300 in Supabase credits.',
    noIndex: true,
  },
  hero: {
    title: 'Get $300 in Supabase credits through AWS Activate',
    description:
      'This offer is exclusively for VC-backed startups accessing Supabase through AWS Activate. Complete the form below to apply.',
    image: {
      src: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=partnerships&layout=icon-only&copy=%5B%24300%5D+in+credits+for%0AAWS+Activate+startups&icon=supabase.svg&icon2=aws.svg',
      alt: 'Supabase and AWS Activate: $300 in credits for eligible startups',
      width: 600,
      height: 315,
    },
    ctas: [
      {
        label: 'Apply for your credits',
        href: '#form',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'single-column',
      title: 'About the offer',
      description:
        'Supabase is the easy-to-use, open-source managed Postgres with integrated backend services. With this exclusive AWS Activate offer, eligible startups receive $300 in Supabase credits to build, scale, and ship faster.',
    },
    {
      type: 'feature-grid',
      title: 'What the credits unlock',
      description: 'An all-in-one suite built on Postgres. Use one or all.',
      columns: 3,
      items: [
        {
          title: 'Database',
          description: 'A full Postgres instance hosted in the cloud.',
        },
        {
          title: 'Auth',
          description:
            'A complete user management system with email, social, and passwordless login.',
        },
        {
          title: 'Storage',
          description: 'Upload and serve files of any size.',
        },
        {
          title: 'Edge Functions',
          description: 'Server-side TypeScript functions, distributed globally at the edge.',
        },
        {
          title: 'Realtime',
          description: 'Live sync for collaborative applications, powered by Postgres replication.',
        },
        {
          title: 'Vector',
          description: 'pgvector for fast semantic search and embedding storage.',
        },
      ],
    },
    {
      type: 'steps',
      title: 'Eligibility requirements',
      description: 'To qualify for this offer you must:',
      items: [
        { title: 'Be a VC-backed startup with less than $5M in total funding' },
        { title: 'Have an active AWS account' },
        { title: 'Not have previously redeemed this offer' },
      ],
    },
    {
      type: 'faq',
      title: 'Frequently asked questions',
      items: [
        {
          question: 'Who is this offer for?',
          answer:
            'VC-backed startups with less than $5M in total funding and an active AWS account.',
        },
        {
          question: 'What can I use the credits for?',
          answer:
            'Credits apply to any Supabase product including database, auth, storage, and edge functions.',
        },
        {
          question: 'How long does it take to hear back?',
          answer:
            "We review applications within 5 business days. You'll receive a confirmation email once submitted.",
        },
        {
          question: 'What happens after I apply?',
          answer:
            'If your application is approved, a member of our team will reach out to activate your credits.',
        },
      ],
    },
    {
      type: 'single-column',
      id: 'form',
      title: 'Apply for your credits',
      children: (
        <div className="mx-auto w-full max-w-2xl">
          <MarketingForm
            fields={[
              {
                type: 'text',
                name: 'firstName',
                label: 'First name *',
                placeholder: 'First name',
                required: true,
                half: true,
              },
              {
                type: 'text',
                name: 'lastName',
                label: 'Last name *',
                placeholder: 'Last name',
                required: true,
                half: true,
              },
              {
                type: 'text',
                name: 'company',
                label: 'Company name *',
                placeholder: 'Company name',
                required: true,
              },
              {
                type: 'text',
                name: 'companyCountry',
                label: 'Company country',
                placeholder: 'Country',
                half: true,
              },
              {
                type: 'text',
                name: 'postalCode',
                label: 'Postal code',
                placeholder: 'Postal code',
                half: true,
              },
              {
                type: 'email',
                name: 'email',
                label: 'Email *',
                description: 'Cannot be a personal or edu account.',
                placeholder: 'you@company.com',
                required: true,
              },
              {
                type: 'url',
                name: 'companyWebsite',
                label: 'Company website *',
                placeholder: 'https://your-company.com',
                required: true,
              },
              {
                type: 'select',
                name: 'stage',
                label: 'Stage *',
                placeholder: 'Select your stage',
                required: true,
                options: [
                  { label: 'Seed', value: 'seed' },
                  { label: 'Series A', value: 'series_a' },
                  { label: 'Series B', value: 'series_b' },
                ],
                half: true,
              },
              {
                type: 'select',
                name: 'totalFunding',
                label: 'Total funding *',
                placeholder: 'Select range',
                required: true,
                options: [
                  { label: 'Less than $1M', value: 'lt_1m' },
                  { label: '$1M – $5M', value: '1m_5m' },
                  { label: '$5M – $10M', value: '5m_10m' },
                  { label: '$10M – $25M', value: '10m_25m' },
                  { label: 'More than $25M', value: 'gt_25m' },
                ],
                half: true,
              },
              {
                type: 'select',
                name: 'institutionalVcBacked',
                label: 'Institutional VC-backed? *',
                placeholder: 'Select an option',
                required: true,
                options: [
                  { label: 'Yes', value: 'yes' },
                  { label: 'No', value: 'no' },
                ],
              },
              {
                type: 'text',
                name: 'vcFirmName',
                label: 'VC firm name *',
                placeholder: 'Lead investor name',
                required: true,
                showWhen: { field: 'institutionalVcBacked', equals: 'yes' },
              },
              {
                type: 'url',
                name: 'fundingProofLink',
                label: 'Funding proof link *',
                description:
                  "Paste a link to your Crunchbase profile, PitchBook page, press announcement, or your investor's portfolio page listing your company.",
                placeholder: 'https://...',
                required: true,
                showWhen: { field: 'institutionalVcBacked', equals: 'yes' },
              },
              {
                type: 'textarea',
                name: 'customerBusinessProblem',
                label: 'Customer business problem',
                placeholder: 'What customer problem does your business solve?',
                rows: 4,
              },
              {
                type: 'text',
                name: 'supabaseRef',
                label: 'Supabase org/project ref (optional)',
                placeholder: 'e.g. abcdefgh1234',
              },
              {
                type: 'text',
                name: 'awsAccountId',
                label: 'AWS account ID *',
                placeholder: '12-digit AWS account ID',
                required: true,
              },
              {
                type: 'checkbox',
                name: 'consent',
                label:
                  'I agree to allow Supabase to store and process the personal data submitted above to process my AWS Activate Exclusive Offer application. *',
                required: true,
              },
            ]}
            submitLabel="Apply for credits"
            successMessage="Thanks! We've received your application and will review it within 5 business days."
            crm={{
              hubspot: {
                formGuid: 'db2718f8-1f23-4fe1-aaab-b4924dc4ca54',
                fieldMap: {
                  firstName: 'firstname',
                  lastName: 'lastname',
                  company: 'company',
                  companyCountry: 'country',
                  postalCode: 'zip',
                  companyWebsite: 'website',
                  stage: 'stage',
                  totalFunding: 'total_funding',
                  institutionalVcBacked: 'institutional_vc_backed',
                  vcFirmName: 'vc_firm_name',
                  fundingProofLink: 'funding_proof_link',
                  customerBusinessProblem: 'customer_business_problem',
                  supabaseRef: 'supabase_org_project_ref',
                  awsAccountId: 'aws_account_id',
                  consent: 'consent',
                },
              },
            }}
          />
        </div>
      ),
    },
  ],
}

export default page
