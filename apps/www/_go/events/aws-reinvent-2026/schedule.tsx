import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'aws-reinvent/schedule',
  metadata: {
    title: 'Meet Supabase at AWS re:Invent 2026 | Supabase',
    description:
      'Book time with the Supabase team onsite at AWS re:Invent 2026. Talk architecture, migrations, and production Postgres with our engineers.',
  },
  hero: {
    title: 'Meet with the Supabase team\nat AWS re:Invent',
    subtitle: 'Build in a weekend, scale to millions',
    description:
      'Want to connect with the Supabase team?\nBook 1:1 time to meet our team using the scheduler below.',
  },
  sections: [
    {
      type: 'hubspot-meeting',
      id: 'schedule',
      title: 'Schedule a meeting',
      description: 'Choose a time that works for you. We will confirm by email.',
      meetingSlug: 'wendie-cheung/aws-reinvent-2026',
    },
  ],
}

export default page
