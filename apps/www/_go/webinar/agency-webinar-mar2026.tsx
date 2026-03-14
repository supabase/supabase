import type { GoPageInput } from 'marketing'
import { MediaBlock } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'agency-webinar-mar2026',
  metadata: {
    title: 'Ship Fast, Stay Safe: Learn More | Supabase Agency Webinar',
    description:
      'You watched the webinar. Want to go deeper? Get resources, talk to our team, or learn how top agencies balance AI prototyping speed with production safety on Supabase.',
    ogImage: '/images/landing-pages/agency-webinar-mar2026/og.png',
  },
  hero: {
    subtitle: 'Thanks for watching',
    title: 'Ship Fast, Stay Safe: AI Prototyping That Survives Production',
    description:
      'You saw how agency leaders balance velocity with control when using AI coding tools to build production applications on Supabase. Want to learn more, get hands-on, or talk to our team? Share your details below.',
    image: {
      src: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=ruler&layout=icon-only&copy=%5B2.5x+faster%5D%0A%5BPostgres+parser%5D%0Awith+Claude+Code&icon=supabase.svg',
      alt: 'Ship Fast, Stay Safe: AI Prototyping That Survives Production',
      width: 400,
      height: 500,
    },
    ctas: [
      {
        label: 'Get in touch',
        href: '#form',
        variant: 'primary',
      },
      {
        label: 'Start your project',
        href: 'https://supabase.com/dashboard',
        variant: 'secondary',
      },
    ],
  },
  sections: [
    {
      type: 'single-column',
      title: 'Watch the recording',
      description:
        'Join agency leaders and Supabase as they share how top agencies balance velocity with control when using AI coding tools to build production applications.',
      // TODO: Add YouTube URL when recording is available
      children: <MediaBlock />,
    },
    {
      type: 'feature-grid',
      title: 'What you learned',
      description:
        'Key takeaways from Ship Fast, Stay Safe: AI Prototyping That Survives Production.',
      items: [
        {
          title: 'Database schemas and RLS policies first',
          description:
            'Why leading agencies design database schemas and RLS policies before touching the UI.',
        },
        {
          title: 'Visual AI builders vs code-first tools',
          description: 'When to use visual AI builders for speed vs code-first tools for control.',
        },
        {
          title: 'Preventing breaking changes',
          description:
            'How to prevent AI tools from making breaking changes to production environments.',
        },
        {
          title: 'Lightweight validation practices',
          description: 'Validation practices that preserve velocity without sacrificing safety.',
        },
        {
          title: 'Client handoff without risk',
          description: 'How to hand projects off to clients without handing over production risk.',
        },
        {
          title: 'Velocity with control',
          description:
            'Learn when to let AI move fast, and where experienced developers still need to step in.',
        },
      ],
    },
    {
      type: 'form',
      id: 'form',
      title: 'Tell us how we can help',
      description: "Share your details and we'll follow up with resources or a conversation.",
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
          name: 'email_address',
          label: 'Email',
          placeholder: 'Work email',
          required: true,
        },
        {
          type: 'text',
          name: 'company_name',
          label: 'Company',
          placeholder: 'Company name',
          required: false,
        },
        {
          type: 'textarea',
          name: 'message',
          label: 'Tell us about your project',
          placeholder: 'I want to build...',
          required: false,
        },
      ],
      submitLabel: 'Get in touch',
      successRedirect: '/go/agency-webinar-mar2026-thankyou',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          formGuid: 'a8276214-6883-4aeb-85d3-8bae81b9f149',
          fieldMap: {
            first_name: 'firstname',
            last_name: 'lastname',
            email_address: 'email',
            company_name: 'name',
            message: 'what_are_you_currently_working_on_',
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
      },
    },
  ],
}

export default page
