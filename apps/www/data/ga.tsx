export const data = {
  hero: {
    title: <>General Availability</>,
    paragraph: 'Published 15 April 2024',
    // publishedAt: '15 April 2024',
    publishedAt: null,
    sections: [
      { title: 'General Availability', link: '#ga' },
      { title: 'Open Source & Community', link: '#open-source' },
      { title: 'Security', link: '#security' },
      { title: 'Performance', link: '#performance' },
      { title: 'Reliability', link: '#reliability' },
      { title: 'Integrations', link: '#integrations' },
      { title: 'Enterprise', link: '#enterprise' },
      { title: 'Core Principles', link: '#principles' },
      { title: 'Our mission', link: '#mission' },
    ],
  },
  companySection: {
    id: 'ga',
    title: 'General Availability',
    paragraph: '01',
    content: `
During the first year of Supabase we set ourselves a goal: build a managed service capable of running 1 million databases, securely, and with minimal downtime. Today we’ve proved that metric and we’re announcing the General Availability of the platform that will service the next 99 million.

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/165a3c21-8e38-4d4b-831a-f9bb88a3262b/cbb8c268-5a73-4af9-962e-acffc66e21af/Untitled.png)

> Supabase database growth since inception.

We’ve been production-ready for years now. We kept the “beta” label because we wanted to make sure that our *organization* can support all types of customers, no matter their demands.

Today we’re confident in our ability to take any profile of customer and help them become successful. We have a crew of amazing Postgres engineers and support staff who work tirelessly to educate customers with Postgres technicalities, improving our product simultaneously.

Whether you’re an indie hacker or a Fortune 500 company, Supabase can now scale comfortably to your production workload. Rocket ships like Udio, Krea, Chatbase, and Pika use Supabase to build fast and scale faster. Enterprise customers such as Mozilla, PWC, and Johnson & Johnson use Supabase to host and manage their backend securely. 30% of the last Y Combinator batch use Supabase to launch their start ups.
`,
  },
  openSourceSection: {
    id: 'open-source',
    title: 'Open Source & Community',
    paragraph: '05',
    content: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
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
  highlightsSection: {
    highlights: [
      {
        number: '1M',
        text: 'databases managed',
      },
      {
        number: '2500',
        text: 'databases launched daily',
      },
      {
        number: 'Top 125',
        text: 'GitHub repo',
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
