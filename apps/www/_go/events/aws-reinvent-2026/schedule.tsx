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
      meetingSlug: 'ktalajic/aws-re-invent-meet-supabase-in-person-re-invent',
    },
    {
      type: 'three-column',
      id: 'growth-leads',
      title: 'Meet our Growth Leads',
      children: (
        <>
          <div className="flex flex-col items-center gap-4 rounded-xl border border-muted p-8 text-center">
            <img
              src="/images/blog/avatars/nate-asp.jpg"
              alt="Nate Asp"
              className="h-24 w-24 rounded-full object-cover"
            />
            <div className="flex flex-col gap-1">
              <h3 className="text-foreground font-medium text-lg">Nate Asp</h3>
              <p className="text-foreground-light text-sm">VP of Sales</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 rounded-xl border border-muted p-8 text-center">
            <img
              src="/images/blog/avatars/brad-gyger.jpg"
              alt="Brad Gyger"
              className="h-24 w-24 rounded-full object-cover"
            />
            <div className="flex flex-col gap-1">
              <h3 className="text-foreground font-medium text-lg">Brad Gyger</h3>
              <p className="text-foreground-light text-sm">VP of Success</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 rounded-xl border border-muted p-8 text-center">
            <img
              src="/images/blog/avatars/kris-talajic.png"
              alt="Kris Talajic"
              className="h-24 w-24 rounded-full object-cover"
            />
            <div className="flex flex-col gap-1">
              <h3 className="text-foreground font-medium text-lg">Kris Talajic</h3>
              <p className="text-foreground-light text-sm">Growth Lead</p>
            </div>
          </div>
        </>
      ),
    },
  ],
}

export default page
