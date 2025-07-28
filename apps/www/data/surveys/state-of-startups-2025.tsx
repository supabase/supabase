const stateOfStartupsData = (isMobile?: boolean) => ({
  metaTitle: 'State of Startups 2025',
  metaDescription:
    'The latest trends among builders in tech stacks, AI usage, problem domains, and more.',
  metaImage: '/images/state-of-startups/2025/state-of-startups-og.png',
  docsUrl: '',
  heroSection: {
    title: 'State of Startups 2025',
    subheader: (
      <>
        We surveyed over 1,800 startup founders and builders to uncover what’s powering modern
        startups: their stacks, their go-to-market motion, and their approach to AI.
        <br />
        This report is built for builders.
      </>
    ),
    className: '[&_h1]:max-w-2xl',
  },
  pageChapters: [
    {
      id: 1,
      title: 'Who’s Building Startups',
      description:
        'Today’s startup ecosystem is dominated by young, technical builders shipping fast with lean teams. They’ve done this before.',
      sections: [
        {
          id: 1.1,
          title: 'Roles and Experience',
          description:
            'Most builders are young, technical founders. Many are on their second or third company.',
          stats: [
            { number: 83, unit: '%', label: 'Technical founders' },
            { number: 82, unit: '%', label: 'Under age 40' },
            { number: 33, unit: '%', label: 'Repeat founders' },
          ],
          charts: ['RoleChart'],
          pullQuote: {
            quote:
              'We’re a two-person team, both technical. It’s not our first rodeo, and that experience helped us move way faster this time.',
            author: 'John Doe',
            authorPosition: 'Founder',
            authorAvatar: '/images/twitter-profiles/qhvO9V6x_400x400.jpg',
          },
          wordCloud: undefined,
          summarizedAnswer: undefined,
        },
      ],
    },
  ],
})

export default stateOfStartupsData
