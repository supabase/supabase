export const AlphaNumbers = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-background"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    value: 3102,
    unit: null,
    name: 'Hosted Databases',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-background"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    value: 5460,
    unit: null,
    name: 'GitHub Stars',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-background"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    value: 505,
    unit: null,
    name: 'GitHub issues resolved',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-background"
      >
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    ),
    value: 379,
    unit: null,
    name: 'Forks of our repositories',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-background"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    value: 88,
    unit: null,
    name: 'Active GitHub contributors',
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-background"
      >
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
    value: 238,
    unit: 'K',
    name: 'Lines of code',
  },
]

export const IntroductionSegments = [
  {
    description:
      "To deliver a production-ready platform, we've put extra effort into three areas of Supabase.",
    chapters: [
      { no: 1, name: 'Performance', key: 'performance' },
      { no: 2, name: 'Security', key: 'security' },
      { no: 3, name: 'Reliability', key: 'reliability' },
    ],
  },
  {
    description:
      "We received an incredible number of feature requests from our Alpha Users, and we're using these conversations build a simple, predictable Beta Pricing model.",
    chapters: [
      { no: 4, name: 'New Features & Integrations', key: 'features' },
      { no: 5, name: 'Beta Pricing', key: 'pricing' },
    ],
  },
  {
    description:
      "Open Source is, and will always be, at the core of everything that we do. Find out how we've been working with the community to support existing OSS projects and Communities.",
    chapters: [{ no: 6, name: 'Open Source', key: 'openSource' }],
  },
  {
    description:
      "And finally, we're partnering with the best in the business to help us achieve our goal of becoming the default backend for every company. We'll be announcing the details soon, and we're excited to share what we have in store for 2021:",
    chapters: [
      { no: 7, name: 'Funding Partners', key: 'fundingPartners' },
      { no: 8, name: 'Scaling Our Team', key: 'scaling' },
      { no: 9, name: "What's Next", key: 'next' },
    ],
  },
]

// Currently unused
export const PerformanceComparisonData = [
  {
    key: 'read',
    title: 'Read (requests/s)',
    stats: [
      { name: 'Supabase', value: 1167 },
      { name: 'Firestore', value: 366 },
    ],
  },
  {
    key: 'write',
    title: 'Write (requests/s)',
    stats: [
      { name: 'Supabase', value: 870 },
      { name: 'Firestore', value: 280 },
    ],
  },
]
