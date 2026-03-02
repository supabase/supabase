import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'byoc-early-access',
  metadata: {
    title: 'Bring Your Own Cloud (BYOC) for Supabase — Early Access',
    description:
      'Deploy Supabase in your own AWS account. Meet strict data residency and compliance requirements while Supabase handles operations, upgrades and monitoring.',
    ogImage: '/images/landing-pages/byoc-early-access/og.png',
  },
  hero: {
    title: 'Bring Your Own Cloud (BYOC) for Supabase',
    subtitle: 'Early Access',
    description:
      'Deploy Supabase in your own AWS account. Meet strict data residency and compliance requirements while Supabase handles operations, upgrades and monitoring.',
    ctas: [
      {
        label: 'Request Early Access',
        href: '#form',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'feature-grid',
      title: 'Your cloud, operated by Supabase',
      description:
        'Get the full power of Supabase deployed inside your own infrastructure.',
      items: [
        {
          title: 'Control where your data goes',
          description:
            'Meet data residency and compliance requirements. Your data stays in your infrastructure and in your region.',
        },
        {
          title: 'Deploy the infrastructure you want',
          description:
            'Choose instance sizes and volumes for your use case. No project size constraints.',
        },
        {
          title: 'Leverage your cloud costs',
          description:
            'Apply pre-negotiated discounts and cloud credits to your Supabase deployment.',
        },
        {
          title: 'Let Supabase manage operations',
          description:
            'Supabase handles deployments, upgrades, monitoring and support. No Ops overhead.',
        },
      ],
    },
    {
      type: 'form',
      id: 'form',
      title: 'Early Access Request Form',
      description:
        "If you are interested in participating in BYOC early access when it becomes available later in 2026, please fill out the form below. A member of the Supabase team will reach out if you've been selected.",
      fields: [
        {
          type: 'text',
          name: 'first_name',
          label: 'First Name',
          placeholder: 'First Name',
          required: true,
          half: true,
        },
        {
          type: 'text',
          name: 'last_name',
          label: 'Last Name',
          placeholder: 'Last Name',
          required: true,
          half: true,
        },
        {
          type: 'email',
          name: 'email',
          label: 'Email Address',
          placeholder: 'Work email',
          required: true,
        },
        {
          type: 'text',
          name: 'company_name',
          label: 'Company Name',
          placeholder: 'Company name',
          required: true,
        },
        {
          type: 'text',
          name: 'supabase_org_name',
          label: 'Supabase Organization Name',
          placeholder: 'Organization name (if applicable)',
          required: false,
        },
      ],
      submitLabel: 'Request Early Access',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          formGuid: 'c09ead14-e1b7-4031-9f77-ba6b2ad96364',
          fieldMap: {
            first_name: 'firstname',
            last_name: 'lastname',
            email: 'email',
            company_name: 'company',
            supabase_org_name: 'what_is_your_supabase_org_slug',
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
        customerio: {
          event: 'early_access_requested',
          profileMap: {
            email: 'email',
            first_name: 'first_name',
            last_name: 'last_name',
          },
        },
      },
    },
  ],
}

export default page
