export const data = {
  hero: {
    title: <>We are moving to General Availability</>,
    // paragraph: 'Published 15 April 2024',
    publishedAt: '15 April 2024',
    // publishedAt: null,
    sections: [
      { title: 'Company', link: '#company' },
      { title: 'Security', link: '#security' },
      { title: 'Performance', link: '#performance' },
      { title: 'Reliability', link: '#reliability' },
      { title: 'Open Source', link: '#open-source' },
      { title: 'Community', link: '#community' },
      { title: 'Integrations', link: '#integrations' },
      { title: 'Enterprise', link: '#enterprise' },
      { title: 'Core Principles', link: '#principles' },
      { title: 'Our mission', link: '#mission' },
    ],
  },
  companySection: {
    id: 'company',
    title: 'Company',
    paragraph: '01',
    content: `
Today Supabase, the Postgres Developer Platform, graduates to General Availability. 

We have <wow numbers> customers, projects, database created, etc. Just since the beginning of 2024, we have <more wow numbers>.

![Supabase GitHub stars growth vs Redis](/images/ga/supabase-gh-stars-redis.jpg)

Many customers have been running production applications on Supabase for the past several years. Supabase may be new to General Availability but we are not new to running demanding production applications.

## What does General Availability mean for Supabase?

During the first year of Supabase we set ourselves a goal: build a managed service capable of running 1 million database, securely, and with minimal downtime. After a couple of years we were happy that we’d successfully built out infrastructure and a team capable of meeting that goal. 

![Supabase customer auth user growth](/images/ga/supabase-customer-auth-user-growth.png)

we slowly started to phase out the “beta” messaging and set ourselves a more ambitious goal. 

Supabase is a tool that can be utilized by developers across an extremely broad spectrum, it doesn’t matter whether you’re a web developer, a mobile dev, a data scientist, or a video game studio, you can use Supabase to store your data and power your most critical applications. With this in mind we knew that we needed to expand our managed service to be capable of supporting ALL developers. That’s tens of millions of devs, running tens of millions of in-production services. You can take Supabase and self-host, we made this easier by providing tooling to deploy to any cloud or hosting provider. But Supabase of course, isn’t just a tool, it’s also a company stacked with security, stability, and database performance experts, and you need these experts to meet our ambitious goal of offering a database and API hosting service that scales to all businesses.

We’ve been production-ready for years now. We kept the “beta” label because we wanted to make sure that our organization can support *all* types of customers, no matter their demands.

Setting up an organization for 24/7 support is hard, especially when we need to simultaneously manage a burgeoning community of open source developers (sometimes more demanding than the paying customers). 

Today we’re confident in our ability to take any profile of customer and help them become successful. We have a crew of amazing Postgres engineers and support staff who work tirelessly to educate customers with Postgres technicalities, improving our product simultaneously.

- Maturity: Support / organizationally, technically
- Enterprise readiness: stability, performance,
- Security: HIPAA support, SOC2, Vanta stuff, time-tested/battle-tested, pen-tests, etc.
- AWS marketplace
`,
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
  securitySection: {
    id: 'security',
    title: 'Security',
    paragraph: '02',
    content: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
  },
  performanceSection: {
    id: 'performance',
    title: 'Performance',
    paragraph: '03',
    content: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
  },
  reliabilitySection: {
    id: 'reliability',
    title: 'Reliability',
    paragraph: '04',
    content: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
  },
  openSourceSection: {
    id: 'open-source',
    title: 'Open Source',
    paragraph: '05',
    content: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
  },
  communitySection: {
    id: 'community',
    title: 'Community',
    paragraph: '06',
    content: `
## Community-driven growth. 

When we [launched on Hacker News](https://news.ycombinator.com/item?id=23319901) in 2020 we recevied a lot of encouragement for our approach. Since then our strategy has been simple: [launch a feature](https://hn.algolia.com/?dateRange=all&page=0&prefix=true&query=supabase&sort=byPopularity&type=story), listen to the feedback, get back to work and do it again. 

All of our growth has been community-driven and word of mouth. 

Supabase is a labor of love for our team. We don’t always get it right, but we always listen to the feedback and try to balance the (often conflicting) needs of a business and a community.

We truly appreciate the feedback - no matter how raw. The fact that we have users that care enough to build a community around Supabase means the world to us. 

- YC community stats: 30% of batch.
`,
  },
  integrationsSection: {
    id: 'integrations',
    title: 'Integrations',
    paragraph: '07',
    content: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
  },
  enterpriseSection: {
    id: 'enterprise',
    title: 'Enterprise',
    paragraph: '08',
    content: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
  },
  principlesSection: {
    id: 'principles',
    title: 'Core Principles',
    paragraph: '09',
    features: [
      {
        icon: `M12.2323 21.9783C14.3462 21.9783 16.0599 17.6131 16.0599 12.2284C16.0599 6.84372 14.3462 2.47856 12.2323 2.47856M12.2323 21.9783C10.1184 21.9783 8.4047 17.6131 8.4047 12.2284C8.4047 6.84372 10.1184 2.47856 12.2323 2.47856M12.2323 21.9783C15.432 21.9783 18.2717 20.4366 20.0495 18.0559M12.2323 21.9783C9.03252 21.9783 6.19277 20.4368 4.41505 18.0559M12.2323 2.47856C15.432 2.47856 18.2717 4.01981 20.0495 6.40045C20.0564 6.40977 20.0634 6.41911 20.0703 6.42846M12.2323 2.47856C9.02002 2.47856 6.1706 4.03191 4.39427 6.42846M2.55542 12.2284H21.9099M20.0495 18.0559C21.2634 16.4302 21.9821 14.4131 21.9821 12.2281C21.9821 10.0557 21.2716 8.04924 20.0703 6.42846M20.0495 18.0559C17.8271 16.9906 15.1343 16.367 12.2323 16.367C9.33023 16.367 6.63737 16.9906 4.41505 18.0559M20.0703 6.42846C17.844 7.49984 15.1434 8.12738 12.2323 8.12738C9.32118 8.12738 6.62057 7.49984 4.39427 6.42846M4.39427 6.42846C3.19294 8.04924 2.48242 10.0557 2.48242 12.2281C2.48242 14.4131 3.20114 16.4302 4.41505 18.0559`,
        title: 'Principle 1',
        text: 'Lorem ipsum dolor sit',
      },
      {
        icon: `M12.2323 21.9783C14.3462 21.9783 16.0599 17.6131 16.0599 12.2284C16.0599 6.84372 14.3462 2.47856 12.2323 2.47856M12.2323 21.9783C10.1184 21.9783 8.4047 17.6131 8.4047 12.2284C8.4047 6.84372 10.1184 2.47856 12.2323 2.47856M12.2323 21.9783C15.432 21.9783 18.2717 20.4366 20.0495 18.0559M12.2323 21.9783C9.03252 21.9783 6.19277 20.4368 4.41505 18.0559M12.2323 2.47856C15.432 2.47856 18.2717 4.01981 20.0495 6.40045C20.0564 6.40977 20.0634 6.41911 20.0703 6.42846M12.2323 2.47856C9.02002 2.47856 6.1706 4.03191 4.39427 6.42846M2.55542 12.2284H21.9099M20.0495 18.0559C21.2634 16.4302 21.9821 14.4131 21.9821 12.2281C21.9821 10.0557 21.2716 8.04924 20.0703 6.42846M20.0495 18.0559C17.8271 16.9906 15.1343 16.367 12.2323 16.367C9.33023 16.367 6.63737 16.9906 4.41505 18.0559M20.0703 6.42846C17.844 7.49984 15.1434 8.12738 12.2323 8.12738C9.32118 8.12738 6.62057 7.49984 4.39427 6.42846M4.39427 6.42846C3.19294 8.04924 2.48242 10.0557 2.48242 12.2281C2.48242 14.4131 3.20114 16.4302 4.41505 18.0559`,
        title: 'Principle 2',
        text: 'Lorem ipsum dolor sit',
      },
      {
        icon: `M12.2323 21.9783C14.3462 21.9783 16.0599 17.6131 16.0599 12.2284C16.0599 6.84372 14.3462 2.47856 12.2323 2.47856M12.2323 21.9783C10.1184 21.9783 8.4047 17.6131 8.4047 12.2284C8.4047 6.84372 10.1184 2.47856 12.2323 2.47856M12.2323 21.9783C15.432 21.9783 18.2717 20.4366 20.0495 18.0559M12.2323 21.9783C9.03252 21.9783 6.19277 20.4368 4.41505 18.0559M12.2323 2.47856C15.432 2.47856 18.2717 4.01981 20.0495 6.40045C20.0564 6.40977 20.0634 6.41911 20.0703 6.42846M12.2323 2.47856C9.02002 2.47856 6.1706 4.03191 4.39427 6.42846M2.55542 12.2284H21.9099M20.0495 18.0559C21.2634 16.4302 21.9821 14.4131 21.9821 12.2281C21.9821 10.0557 21.2716 8.04924 20.0703 6.42846M20.0495 18.0559C17.8271 16.9906 15.1343 16.367 12.2323 16.367C9.33023 16.367 6.63737 16.9906 4.41505 18.0559M20.0703 6.42846C17.844 7.49984 15.1434 8.12738 12.2323 8.12738C9.32118 8.12738 6.62057 7.49984 4.39427 6.42846M4.39427 6.42846C3.19294 8.04924 2.48242 10.0557 2.48242 12.2281C2.48242 14.4131 3.20114 16.4302 4.41505 18.0559`,
        title: 'Principle 3',
        text: 'Lorem ipsum dolor sit',
      },
      {
        icon: `M12.2323 21.9783C14.3462 21.9783 16.0599 17.6131 16.0599 12.2284C16.0599 6.84372 14.3462 2.47856 12.2323 2.47856M12.2323 21.9783C10.1184 21.9783 8.4047 17.6131 8.4047 12.2284C8.4047 6.84372 10.1184 2.47856 12.2323 2.47856M12.2323 21.9783C15.432 21.9783 18.2717 20.4366 20.0495 18.0559M12.2323 21.9783C9.03252 21.9783 6.19277 20.4368 4.41505 18.0559M12.2323 2.47856C15.432 2.47856 18.2717 4.01981 20.0495 6.40045C20.0564 6.40977 20.0634 6.41911 20.0703 6.42846M12.2323 2.47856C9.02002 2.47856 6.1706 4.03191 4.39427 6.42846M2.55542 12.2284H21.9099M20.0495 18.0559C21.2634 16.4302 21.9821 14.4131 21.9821 12.2281C21.9821 10.0557 21.2716 8.04924 20.0703 6.42846M20.0495 18.0559C17.8271 16.9906 15.1343 16.367 12.2323 16.367C9.33023 16.367 6.63737 16.9906 4.41505 18.0559M20.0703 6.42846C17.844 7.49984 15.1434 8.12738 12.2323 8.12738C9.32118 8.12738 6.62057 7.49984 4.39427 6.42846M4.39427 6.42846C3.19294 8.04924 2.48242 10.0557 2.48242 12.2281C2.48242 14.4131 3.20114 16.4302 4.41505 18.0559`,
        title: 'Principle 4',
        text: 'Lorem ipsum dolor sit',
      },
    ],
  },
  missionSection: {
    id: 'mission',
    title: 'Our Mission',
    paragraph: '10',
    content: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
  },
}
