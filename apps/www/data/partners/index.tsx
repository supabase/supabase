import { IconAward, IconCompass, IconDollarSign, IconGlobe, IconTrendingUp } from 'ui'

export default {
  metaTitle: 'Partner with Supabase',
  metaDescription: 'Become a Supabase Partner and enable new business opportunities.',
  heroSection: {
    title: 'Partners',
    h1: <span className="heading-gradient">Partner with Supabase</span>,
    subheader: (
      <>
        Apply to the Partners program to list your integration <br className="hidden md:block" /> in
        our marketplace and grow your business.
      </>
    ),
    image: (
      <div className="relative z-10 flex items-center justify-center mb-4">
        <div
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3ECF8E] via-[#576a61] to-[#3ecfb2] border border-brand-900 flex items-center justify-center"
          style={{
            boxShadow: '0 0 20px #25e7761f, 0 0 30px rgba(238, 240, 190, 0.1)',
          }}
        >
          <svg
            className="text-background-alternative h-8 w-8 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12.0003 6.1488L10.5812 4.76334C8.68921 2.91613 5.62161 2.91613 3.72957 4.76334C1.98628 6.46532 1.84923 9.14165 3.31842 10.9968C3.44378 11.1551 3.77166 11.514 3.92041 11.6592M12.0003 6.1488L13.4193 4.76334C15.3113 2.91613 18.3789 2.91613 20.271 4.76334C22.163 6.61054 22.163 9.60546 20.271 11.4527L19.2017 12.5186M12.0003 6.1488L10.7542 7.39725C10.0214 8.13141 10.0219 9.32043 10.7554 10.0539C11.4894 10.7879 12.6793 10.7879 13.4133 10.0539L16.0693 7.39787M14.9131 13.4531L17.4954 16.1809M17.4954 16.1809C18.2089 16.9347 18.1764 18.1242 17.4226 18.8378C16.6693 19.5509 15.4807 19.5189 14.7669 18.7663L13.3188 17.2217M17.4954 16.1809C18.2086 16.9344 19.3982 16.9676 20.1516 16.2543C20.9051 15.5411 20.9376 14.3521 20.2244 13.5987L17.6415 10.8703M6.13555 14.7589L7.46387 13.4306M6.13555 14.7589C5.40193 15.4925 4.21251 15.4925 3.47889 14.7589C2.74528 14.0253 2.74528 12.8358 3.47889 12.1022L4.80722 10.7739C5.54084 10.0403 6.73026 10.0403 7.46388 10.7739C8.19749 11.5075 8.19749 12.6969 7.46387 13.4306M6.13555 14.7589C5.40193 15.4925 5.40193 16.6819 6.13555 17.4155C6.86916 18.1492 8.05859 18.1492 8.7922 17.4155M7.46387 13.4306C8.19749 12.6969 9.38691 12.6969 10.1205 13.4306C10.8541 14.1642 10.8541 15.3536 10.1205 16.0872M8.7922 17.4155L10.1205 16.0872M8.7922 17.4155C8.05859 18.1492 8.05859 19.3386 8.7922 20.0722C9.52582 20.8058 10.7152 20.8058 11.4489 20.0722L12.7772 18.7439C13.5108 18.0102 13.5108 16.8208 12.7772 16.0872C12.0436 15.3536 10.8541 15.3536 10.1205 16.0872"
            />
          </svg>
        </div>
      </div>
    ),
    cta: {
      label: 'Become a Partner',
      link: 'https://forms.supabase.com/partner',
    },
  },
  oAuthApp: {
    steps: [
      {
        title: 'Register App',
        text: 'An OAuth app first needs to be registered with Supabase',
      },
      {
        title: 'Add OAuth2 Support',
        text: 'Use the OAuth2 protocol to access a users organization or project',
      },
      {
        title: 'Receive Tokens',
        text: "You'll receive a new access and refresh token",
      },
      {
        title: 'Control Projects',
        text: 'Use Supabase REST API to control projects and other settings',
      },
    ],
  },
  featureBlocks: [
    {
      title: 'Technical support',
      description: 'Access technical support to back your integrations and customer projects.',
      icon: <IconCompass strokeWidth={1.5} />,
    },
    {
      title: 'Expand your ecosystem',
      description: 'Offer your own products and services to Supabase customers.',
      icon: <IconGlobe strokeWidth={1.5} />,
    },
    {
      title: 'Business growth',
      description: 'Explore new revenue streams and growth potential.',
      icon: <IconDollarSign strokeWidth={1.5} />,
    },
    {
      title: 'Scale with us',
      description: 'Scale automatically with the power of open-source Postgres technology.',
      icon: <IconTrendingUp strokeWidth={1.5} />,
    },
  ],
  featuredApps: [
    {
      name: 'Arengu',
      type: 'integration',
      logo: 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/integrations/arengu/arengu_logo.jpeg',
    },
    {
      name: 'Auth0',
      type: 'integration',
      logo: 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/integrations/auth0/auth0_dark.png?t=2023-07-19T19%3A13%3A04.189Z',
    },
    {
      name: 'Appsmith',
      type: 'integration',
      logo: 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/integrations/appsmith/appsmith-logo.png',
    },
    {
      name: 'CALDA',
      type: 'experts',
      logo: 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/experts/calda/calda_logo.jpeg',
    },
    {
      name: 'Morrow',
      type: 'experts',
      logo: 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/experts/morrow/morrow-logo.png',
    },
    {
      name: 'Voypost',
      type: 'experts',
      logo: 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/experts/voypost/33024474.png',
    },
    {
      name: 'Vercel',
      type: 'integration',
      logo: 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/integrations/vercel/vercel-icon.jpeg',
    },
    {
      name: 'Prisma',
      type: 'integration',
      logo: 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/integrations/prisma/prisma-icon.png',
    },
    {
      name: 'Cloudflare-workers',
      type: 'integration',
      logo: 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/integrations/cloudflare-integration/cloudflare_workers_logo.png?t=2023-07-21T11%3A07%3A47.005Z',
    },
    {
      name: 'Codesandbox',
      type: 'integration',
      logo: 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/integrations/codesandbox/codesandbox_logo.jpeg',
    },
  ],
}
