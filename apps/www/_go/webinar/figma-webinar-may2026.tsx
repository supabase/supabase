import type { GoPageInput } from 'marketing'
import { MediaBlock } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'figma-webinar-may2026',
  metadata: {
    title: 'Fully Operational: Learn More | Supabase + Figma Make Webinar',
    description:
      'You watched the webinar. Want to go deeper? Get resources, talk to our team, or learn how to build production-ready apps with Figma Make and Supabase.',
    ogImage: '/images/landing-pages/figma-webinar-may2026/og.png',
  },
  hero: {
    subtitle: 'Thanks for watching',
    title: 'Fully Operational: Building Production-Ready Apps with Figma Make + Supabase',
    description:
      'You saw how to go from a working prototype to a production-ready application with Figma Make and Supabase. Want to learn more, get hands-on, or talk to our team? Share your details below.',
    image: {
      src: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=platform&layout=icon-only&copy=%5B2.5x+faster%5D%0A%5BPostgres+parser%5D%0Awith+Claude+Code&icon=supabase.svg&icon2=figma.svg',
      alt: 'Fully Operational: Building Production-Ready Apps with Figma Make + Supabase',
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
        'Join engineers from Supabase and Figma as they walk through what it takes to go from a working prototype to a production-ready application.',
      // TODO: Add YouTube URL when recording is available
      children: <MediaBlock />,
    },
    {
      type: 'feature-grid',
      title: 'What you learned',
      description:
        'Key takeaways from Fully Operational: Building Production-Ready Apps with Figma Make + Supabase.',
      items: [
        {
          title: 'Where vibe-coded apps break',
          description: 'Where vibe-coded apps typically break on the way to production.',
        },
        {
          title: 'Auth and RLS without rewriting',
          description:
            'How to add authentication and row-level security without rewriting your app.',
        },
        {
          title: 'Figma Make and Supabase together',
          description: 'How Figma Make and Supabase work together end to end.',
        },
        {
          title: 'Live build',
          description: 'From design to deployed, production-grade app in one session.',
        },
        {
          title: 'Secure and scalable',
          description: 'Ship apps that are secure, scalable, and ready for real traffic.',
        },
        {
          title: 'Design-to-code workflow',
          description: "Pair Figma Make's design-to-code workflow with Supabase's backend.",
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
      successRedirect: '/go/figma-webinar-may2026-thankyou',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          formGuid: 'f8332cbd-6e45-48f7-bcf0-5596c89627e1',
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
