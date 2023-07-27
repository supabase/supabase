export default {
  metaTitle: 'Partner with Supabase',
  metaDescription: 'Become a Supabase Partner and enable new business opportunities.',
  heroSection: {
    // title: 'Partners',
    h1: <span className="heading-gradient">Partner with Supabase</span>,
    subheader: (
      <>
        {/* Grow your business with Supabase. Get the resources and technical support you need to build
        solutions that integrate with our services. */}
        Apply to the Partners program to list your integration <br className="hidden md:block" /> in
        our marketplace and grow your business.
      </>
    ),
    // image: '',
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
}
