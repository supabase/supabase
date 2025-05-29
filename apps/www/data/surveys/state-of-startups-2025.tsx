export default (isMobile?: boolean) => ({
  metaTitle: 'State of Startups 2025',
  metaDescription: '',
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
        Take our State of Startups 2025 survey and learn the latest trends among builders in tech
        stacks, AI usage, problem domains, and more. <br className="hidden md:block" />
        Get an exclusive Supabase t-shirt for sharing your insights.
      </>
    ),
    // image: '/images/product/vector/vector-hero.svg',
    // icon: null,
    cta: {
      label: 'Take the survey',
      link: '#',
      action: () => null,
    },
    className: '[&_h1]:max-w-2xl',
  },
})
