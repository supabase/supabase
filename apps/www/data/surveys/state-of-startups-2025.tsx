export default (isMobile?: boolean) => ({
  metaTitle: 'State of Startups 2025',
  metaDescription:
    'Take the survey and learn the latest trends among builders in tech stacks, AI usage, problem domains, and more.',
  metaImage: '/images/modules/vector/og.png',
  docsUrl: '',
  heroSection: {
    title: 'State of Startups 2025',
    h1: (
      <>
        The Postgres Vector database <br className="hidden md:block" />
        and AI Toolkit
      </>
    ),
    subheader: (
      <>
        There's never been a better time to build.
        <br />
        Take our State of Startups survey to receive an exclusive Supabase t-shirt and a report on
        the survey results.
      </>
    ),
    className: '[&_h1]:max-w-2xl',
  },
})
