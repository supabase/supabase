import solutions from '../Solutions'

export default {
  heroSection: {
    heading: (
      <>
        <span className="block text-[#F4FFFA00] bg-clip-text bg-gradient-to-b from-scale-1200 to-scale-1200 dark:to-scale-1100">
          Build in a weekend
        </span>
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#3ECF8E] via-[#3ECF8E] to-[#3ecfb2] block md:ml-0">
          Scale to millions
        </span>
      </>
    ),
    subheading: (
      <>
        Supabase is an open source Firebase alternative. <br className="hidden md:block" />
        Start your project with a Postgres database, Authentication, instant APIs, Edge Functions,
        Realtime subscriptions, Storage, and Vector embeddings.
      </>
    ),
    image: '/images/index/gradient-bg.png',
    cta: {
      label: 'Start your project',
      link: 'https://app.supabase.com',
    },
    secondaryCta: {
      label: 'Documentation',
      link: '/docs',
    },
  },
  productsSection: {
    products: { ...solutions },
  },
  integrations: {
    label: 'Integrations',
    title: (
      <>
        Power your project <br className="hidden sm:block" />
        with the tools you love
      </>
    ),
    cta: {
      label: 'Explore integrations',
      link: '/partners/integrations',
    },
  },
}
