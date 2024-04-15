export const data = {
  hero: {
    title: <>We are moving to General Availability</>,
    // paragraph: 'Published 15 April 2024',
    publishedAt: '15 April 2024',
    // publishedAt: null,
    sections: [
      { title: 'General Availability', link: '#ga' },
      { title: 'Open Source & Community', link: '#open-source' },
      { title: 'Scale to millions', link: '#scale' },
      { title: 'Enterprise', link: '#enterprise' },
      { title: 'Our partners', link: '#partners' },
      { title: "What's new", link: '#whats-new' },
      { title: "What's next", link: '#whats-next' },
    ],
  },

  highlightsSection: {
    highlights: [
      {
        number: '1,000,000+',
        text: 'databases managed',
      },
      {
        number: '2,500+',
        text: 'databases launched daily',
      },
      {
        number: 'Top 125 GitHub Ranking',
        text: 'GitHub repo star rating',
      },
    ],
  },
  companySection: {
    id: 'ga',
    title: 'General Availability',
    paragraph: '01',
    content: `
During the first year of Supabase we set ourselves a goal: build a managed service capable of running 1 million databases, securely, and with minimal downtime. Today we've proved that metric and we're announcing the General Availability of the platform that will service the next 99 million.

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/165a3c21-8e38-4d4b-831a-f9bb88a3262b/cbb8c268-5a73-4af9-962e-acffc66e21af/Untitled.png)

> Supabase database growth since inception.

We've been production-ready for years now. We kept the “beta” label because we wanted to make sure that our *organization* can support all types of customers, no matter their demands.

Today we're confident in our ability to take any profile of customer and help them become successful. We have a crew of amazing Postgres engineers and support staff who work tirelessly to educate customers with Postgres technicalities, improving our product simultaneously.

Whether you're an indie hacker or a Fortune 500 company, Supabase can now scale comfortably to your production workload. Rocket ships like Udio, Krea, Chatbase, and Pika use Supabase to build fast and scale faster. Enterprise customers such as Mozilla, PWC, Johnson & Johnson, and 1Password use Supabase to manage their applications securely. 30% of the last Y Combinator batch use Supabase to launch their start ups.

> “Supabase has been great to develop applications. As a firm focused on security, we've been happy to work with Row Level Security Policies to secure database operations.”

> Matthieu, Tech Lead. PWC France
`,
  },
  openSourceSection: {
    id: 'open-source',
    title: 'Open Source & Community',
    paragraph: '05',
    content: `
Our community is the driving force behind the development and adoption of Supabase. 

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/165a3c21-8e38-4d4b-831a-f9bb88a3262b/f9587845-c797-4ec5-835d-4b2d2ec396bc/Untitled.png)

The GitHub community is the foundation of our company: submitting feature requests, discovering bugs, creating PRs, and pushing our team to develop a useful product. 

We're committed to our licenses - all of our public repos have OSI-compliant licenses. We have no plans to change this.

Self-hosting is easier than ever. You can get started in [less than 5 minutes](https://www.youtube.com/watch?v=FqiQKRKsfZE) on a hosted VPS.

We're committed to our free tier - we know the importance of this for testing hobby projects and prototyping. Almost all of the largest databases on Supabase today started on the free tier, a clear indication that our free tier is important for building an enduring platform.
`,
  },
  scaleSection: {
    id: 'scale',
    title: 'Build in a weekend, scale to millions',
    paragraph: '05',
    content: `
Our tagline is “Build in a weekend, scale to millions”. This isn't hyperbole. In the past, reaching 1 million users was an incredible challenge. It took Instagram 2.5 months, Facebook 10 months, and Twitter 24 months.

In the past year, we've had 11 companies build with Supabase and grow from zero to over 1 million users. 

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/165a3c21-8e38-4d4b-831a-f9bb88a3262b/f37124ce-8078-4ddc-afd0-690c07958982/Untitled.png)

Most of these were AI companies, like Udio, Krea, Chatbase, Pika, Quivr, Mendable, Markprompt and [MDN search](https://developer.mozilla.org/en-US/blog/introducing-ai-help/) by Mozilla.

Postgres has been instrumental in our scalability and adoption. It's versatility is best demonstrated by pgvector. We were the fist cloud provider to offer it, and today 15% of all new Supabase projects use pgvector for AI and ML workloads. 
`,
  },
  enterpriseSection: {
    id: 'enterprise',
    title: 'Enterprise',
    paragraph: '08',
    content: `
Supabase can now scale comfortably to any workload. Companies such as 1Password, PWC, & Johnson & Johnson are now running Supabase in production.

We've spent the last few years working with these larger organizations on their requirements for running Supabase in production which include things like secure data systems and practices (SOC2 and HIPAA), round the clock support, and SLAs.

This week we're announcing that we've partnered with Amazon to offer Supabase through the AWS Marketplace, so customers can now purchase Supabase as part of their AWS committed spend.

We'll continue to expand the Supabase Enterprise offering to include more deployment options, if you're interested in using Supabase in production at your organization get in touch via the [Supabase for Enterprise form](https://forms.supabase.com/enterprise).
`,
  },
  integrationsSection: {
    id: 'partners',
    title: 'Our partners',
    paragraph: '07',
    content: `
The Supabase community could not exist in isolation, it’s part of a group of developer focussed companies and communities who are constantly pushing the boundaries of developer experience and developer productivity.

Cloudflare recently announced the Supabase integration for [Workers](https://developers.cloudflare.com/workers/databases/native-integrations/supabase/) and [Hyperdrive](https://developers.cloudflare.com/hyperdrive/examples/supabase/). 

Vercel users can use the [Supabase integration](https://vercel.com/integrations/supabase) to connect Supabase to their Next.js projects, and we have deep integrations with [Fly.io](https://fly.io/docs/reference/supabase/), [Flutterflow](https://docs.flutterflow.io/data-and-backend/supabase), [Resend](https://resend.com/blog/how-to-configure-supabase-to-send-emails-from-your-domain), and [Twilio](https://www.twilio.com/en-us/blog/send-sms-notifications-supabase-users-node-js-twilio-messaging).

Developers have different preferences on how to connect to their database, and Supabase is ["just Postgres"](https://itsjustpostgres.com/) you can connect natively with [Prisma](https://www.prisma.io/docs/orm/overview/databases/supabase), [Drizzle](https://orm.drizzle.team/docs/get-started-postgresql#supabase), or [Kysely](https://github.com/kysely-org/kysely-supabase).

You can find the full list of Supabase [partners and integrations here](https://supabase.com/partners/integrations), and if you're interested in partnering with Supabase head over to the [Partner Portal](https://supabase.com/partners).
`,
  },
  newSection: {
    id: 'whats-new',
    title: "What's new?",
    paragraph: '10',
    content: `
No Supabase announcement is complete without a round up of new features.
- Index advisor
- Branching
- Oriole acquisition
- Supabase Bootstrap
- Supabase Swift official support

`,
  },
  nextSection: {
    id: 'whats-next',
    title: "What's next?",
    paragraph: '10',
    content: `

This is the first day of GA Week. Today's releases are just the start: we have 4 more days of exciting announcements to come.

One of our key metrics at Supabase is "Time to Value". How fast can a user go from sign up, to making their first API request? How fast can they go from development to production? We’ll never stop pushing on what’s possible here. We're looking forward to the next 99 million dataabases.

If you want to try Supabase today, we just started an asynchronous hackathon. It's a great way to try out all the new features.

`,
  },
}
