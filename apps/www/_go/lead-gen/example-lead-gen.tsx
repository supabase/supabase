import { MediaBlock } from 'marketing'
import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'example-ebook',
  metadata: {
    title: 'Free Ebook: Building Modern Applications with Supabase',
    description:
      'Download our comprehensive guide to building scalable applications with Supabase. Learn best practices for authentication, database design, and real-time features.',
    ogImage: '/images/landing-pages/example-ebook/og.png',
  },
  hero: {
    title: 'Building Modern Applications with Supabase',
    subtitle: 'Sample ebook landing page',
    description:
      'This is a sample lead generation page. The content below demonstrates the template layout. Replace it with your real ebook title, description, and cover image.',
    image: {
      src: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=announcement&layout=vertical&copy=Modern+applications&icon=supabase.svg',
      alt: 'Ebook cover: Building Modern Applications with Supabase',
      width: 400,
      height: 500,
    },
    ctas: [
      {
        label: 'Download Free Ebook',
        href: '#form',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'single-column',
      title: 'See Supabase in action',
      description: 'Watch a quick overview of what you can build with Supabase.',
      children: <MediaBlock youtubeUrl="https://www.youtube.com/watch?v=YR30uzwWoDM" />,
    },
    {
      type: 'feature-grid',
      title: 'Developers can build faster with Supabase',
      description: 'Features that help developers move quickly and focus.',
      items: [
        {
          title: 'AI Assistant',
          description:
            'A single panel that persists across the Supabase Dashboard and maintains context across AI prompts.',
        },
        {
          title: 'MCP Server',
          description:
            'Connect your favorite AI tools such as Cursor or Claude directly with Supabase.',
        },
        {
          title: 'Auto-generated APIs',
          description:
            "Learn SQL when you're ready. In the meantime, Supabase generates automatic APIs to make coding a lot easier.",
        },
        {
          title: 'Foreign Data Wrappers',
          description:
            'Connect Supabase to Redshift, BigQuery, MySQL, and external APIs for seamless integrations.',
        },
        {
          title: 'Instant and secure deployment',
          description: 'No need to set up servers, manage DevOps, or tweak security settings.',
        },
        {
          title: 'Observability',
          description:
            'Built-in logs, query performance tools, and security insights for easy debugging.',
        },
      ],
    },
    {
      type: 'metrics',
      items: [
        { label: 'Databases created', value: '16,000,000+' },
        { label: 'Databases launched daily', value: '90,000+' },
        { label: 'GitHub stars', value: '80,000+' },
      ],
    },
    {
      type: 'tweets',
      title: 'Loved by developers',
      description: 'Discover what our community has to say about their Supabase experience.',
      ctas: [
        {
          label: 'Start your project',
          href: 'https://supabase.com/dashboard',
          variant: 'primary',
        },
      ],
    },
    {
      type: 'form',
      title: 'Get in touch',
      description: 'Fill out the form below and our team will get back to you shortly.',
      fields: [
        {
          type: 'text',
          name: 'firstName',
          label: 'First Name',
          placeholder: 'First Name',
          required: true,
          half: true,
        },
        {
          type: 'text',
          name: 'lastName',
          label: 'Last Name',
          placeholder: 'Last Name',
          required: true,
          half: true,
        },
        {
          type: 'email',
          name: 'email',
          label: 'Company Email',
          placeholder: 'Company Email',
          required: true,
        },
        {
          type: 'textarea',
          name: 'interest',
          label: 'What are you interested in?',
          placeholder: 'Share more about what you want to accomplish',
        },
      ],
      submitLabel: 'Request a demo',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          formGuid: 'b9abbf77-86ae-4fe7-9147-d15922bf58ca',
          fieldMap: {
            firstName: 'firstname',
            lastName: 'lastname',
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
      },
    },
  ],
}

export default page
