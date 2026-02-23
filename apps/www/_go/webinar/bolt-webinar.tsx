import type { GoPageInput } from 'marketing'
import { MediaBlock } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'bolt-webinar',
  metadata: {
    title: 'Vibe Coding, Done Right: Learn More | Supabase + Bolt.new',
    description:
      'You watched the webinar. Want to go deeper? Get resources, talk to our team, or try Supabase with Bolt for AI-assisted development in production.',
    ogImage: '/images/landing-pages/bolt-webinar/og.png',
  },
  hero: {
    title: 'Thanks for watching',
    subtitle: 'Vibe Coding, Done Right: AI Development in Production',
    description:
      'You saw how enterprise teams use Bolt and Supabase to build production apps with AI coding tools. Want to learn more, get hands-on, or talk to our team? Share your details below.',
    ctas: [
      {
        label: 'Get in touch',
        href: '#form',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'single-column',
      title: 'Watch the recording',
      description: 'Join Bolt CEO Eric Simons and learn how enterprise innovation teams are using AI coding tools to build real applications on Supabase.',
      children: <MediaBlock youtubeUrl="https://www.youtube.com/watch?v=YR30uzwWoDM" />,
    },
    {
      type: 'feature-grid',
      title: 'What you learned',
      description: 'Key takeaways from Vibe Coding, Done Right: AI Development in Production.',
      items: [
        {
          title: 'Non-technical teams building in production',
          description:
            'How to give non-technical teams the ability to build production software without compromising security or stability.',
        },
        {
          title: 'Governance for AI-assisted development',
          description:
            'The governance model that makes AI-assisted development safe for enterprises.',
        },
        {
          title: 'Prototypes that go to production',
          description:
            'Why prototypes built on the right foundation can go to production without being rebuilt.',
        },
        {
          title: 'Build vs. buy',
          description:
            'How to evaluate SaaS contracts differently when building becomes cheaper than buying.',
        },
        {
          title: 'Rapid prototyping and internal tools',
          description:
            'Real-world use cases for rapidly prototyping and building internal tools with Bolt and Supabase.',
        },
        {
          title: 'MCP and your database',
          description:
            'The MCP integration that connects AI coding tools directly to your database.',
        },
      ],
    },
    {
      type: 'form',
      title: 'Tell us how we can help',
      description:
        'Share your details and we’ll follow up with resources or a conversation.',
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
      ],
      submitLabel: 'Get in touch',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          formGuid: 'REPLACE_WITH_HUBSPOT_FORM_GUID',
          fieldMap: {
            first_name: 'firstname',
            last_name: 'lastname',
            email_address: 'email',
            company_name: 'company',
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
      },
    },
  ],
}

export default page
