import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'aws-reinvent/schedule',
  theme: 'light',
  metadata: {
    title: 'Meet Supabase at AWS re:Invent 2026 | Supabase',
    description:
      'Book time with the Supabase team onsite at AWS re:Invent 2026. Talk architecture, migrations, and production Postgres with our engineers.',
  },
  hero: {
    title: 'Plan your next stage of growth with Supabase at AWS re:Invent',
    subtitle: 'Build in a weekend, scale to millions',
    description:
      "Book 1:1 time with our team while we're in Las Vegas.\nWe'll talk through where your build is headed and how to grow it.\nBring your roadmap, your open questions, or a problem you're stuck on.",
    ctas: [{ label: 'Book a time', href: '#schedule', variant: 'primary' }],
  },
  sections: [
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
    {
      type: 'single-column',
      id: 'schedule',
      title: 'Schedule a meeting',
      description: 'Choose a time that works for you. We will confirm by email.',
      children: (
        <>
          <div
            className="meetings-iframe-container"
            data-src="https://meetings.hubspot.com/wendie-cheung/aws-reinvent-2026?embed=true"
          />
          {/* HubSpot's embed script must be a parser-inserted tag right after the container; next/script loads it after page load and misses the container. */}
          {/* eslint-disable-next-line @next/next/no-sync-scripts */}
          <script src="https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js" />
        </>
      ),
    },
  ],
}

export default page
