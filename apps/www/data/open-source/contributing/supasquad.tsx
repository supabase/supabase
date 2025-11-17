import { Badge, Image } from 'ui'
import { companyStats } from '~/data/company-stats'

export const data = {
  metadata: {
    metaTitle: 'SupaSquad - Supabase advocate program',
    metaDescription:
      'The SupaSquad is an official Supabase advocate program where community members help build and manage the Supabase community.',
  },
  heroSection: {
    id: 'hero',
    title: 'Join the squad',
    h1: <>Become a Cornerstone of the Supabase Community</>,
    subheader: [
      <>
        Join passionate contributors to shape the entire Supabase experience. From helping
        developers solve problems to creating guides, advocating on social channels, and maintaining
        code repositories, find your way to make a meaningful impact.
      </>,
    ],
    image: (
      <Image
        src={{
          dark: '/images/solutions/beginners/beginners-hero-dark.svg',
          light: '/images/solutions/beginners/beginners-hero-light.svg',
        }}
        alt="Supabase for Beginners"
        className="not-sr-only"
        width={1000}
        height={1000}
      />
    ),
    ctas: [
      {
        label: 'Learn how to join',
        href: '#why-supasquad',
        type: 'primary' as any,
      },
    ],
  },
  quotes: {
    id: 'quotes',
    items: [
      {
        avatar:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        author: 'Sarah Chen',
        authorTitle: 'SupaSquad Helper',
        quote: (
          <>
            Being a Helper in SupaSquad has been incredibly rewarding. There's nothing like that
            moment when you help someone solve a problem they've been stuck on for hours.{' '}
            <span className="text-foreground">The community is so supportive</span>, and I've
            learned so much by helping others work through challenges I haven't faced myself.
          </>
        ),
      },
      {
        avatar:
          'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        author: 'Marcus Torres',
        authorTitle: 'SupaSquad Advocate',
        quote: (
          <>
            As an Advocate, I get to share my genuine excitement about Supabase with the broader
            developer community.{' '}
            <span className="text-foreground">
              It's amazing to see developers discover how much faster they can build
            </span>{' '}
            when they don't have to worry about backend complexity.
          </>
        ),
      },
      {
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        author: 'Alex Kim',
        authorTitle: 'SupaSquad Maintainer',
        quote: (
          <>
            Contributing as a Maintainer has accelerated my growth as a developer more than any
            course could.
            <span className="text-foreground">
              Working directly with the core team on real production code
            </span>{' '}
            has given me insights I never would have gained otherwise.
          </>
        ),
      },
    ],
  },
  why: {
    id: 'why-supasquad',
    label: '',
    heading: (
      <>
        Contribute in the way that best fits your{' '}
        <span className="text-foreground">unique skills</span>
      </>
    ),
    subheading:
      "We recognize that every contributor brings unique strengths, which is why we've created four distinct tracks to match how you want to make an impact. You can join one or multiple tracks based on your interests and skills.",
    features: [
      {
        id: 'advocate',
        icon: 'heart',
        heading: 'Advocate',
        subheading:
          "Spread the word on social channels and help answer Supabase-related questions across the broader developer community. Your voice helps more builders discover what's possible.",
      },
      {
        id: 'helper',
        icon: 'life-buoy',
        heading: 'Helper',
        subheading:
          "Share your expertise by answering questions on Discord, GitHub Discussions, and other community platforms. Help improve docs and guides that make everyone's journey smoother.",
      },
      {
        id: 'maintainer',
        icon: 'wrench',
        heading: 'Maintainer',
        subheading:
          'Contribute to client libraries, manage issues, fix bugs, and improve the overall developer experience. Work directly with the core team to keep Supabase running smoothly.',
      },
      {
        id: 'moderator',
        icon: 'shield',
        heading: 'Moderator',
        subheading:
          'Maintain welcoming community guidelines across GitHub, Discord, Reddit, and other platforms. Ensure our spaces remain productive and helpful for all members.',
      },
    ],
  },
  timing: {
    id: 'results',
    heading: <>The Perfect Time to Join</>,
    subheading:
      "Supabase's explosive growth means more builders need help. There are more opportunities to contribute, and more ways to make your mark. Join SupaSquad and help us support this thriving ecosystem of builders.",
    highlights: [
      {
        heading: companyStats.databasesManaged.label,
        subheading: companyStats.databasesManaged.text,
      },
      {
        heading: companyStats.databasesLaunchedDaily.label,
        subheading: companyStats.databasesLaunchedDaily.text,
      },
    ],
  },
  featured: {
    id: 'featured',
    label: '',
    heading: (
      <>
        <p className="label">Featured</p>
        <span className="text-foreground">We're especially looking for</span>
      </>
    ),
    subheading:
      "These are the areas where we need the most help right now. If you have expertise in any of these domains, we'd love to hear from you!",
    features: [
      {
        id: 'expo',
        icon: 'smartphone',
        heading: (
          <div className="flex items-center gap-2">
            Expo <Badge variant="success">High Priority</Badge>
          </div>
        ),
        subheading:
          'Know Expo really well? Come help the team by writing docs, creating examples, and making sure our guides are up to date. ',
      },
      {
        id: 'ai-builders',
        icon: 'bot',
        heading: (
          <div className="flex items-center gap-2">
            AI Builders <Badge variant="success">High Priority</Badge>
          </div>
        ),
        subheading:
          "Help our users who are building with AI + Supabase. If you've vibed a bunch of projects but understand what's happening under the hood, we'd love to talke with you .",
      },
      {
        id: 'realtime',
        icon: 'zap',
        heading: (
          <div className="flex items-center gap-2">
            Realtime <Badge variant="success">High Priority</Badge>
          </div>
        ),
        subheading:
          'Help the team by writing docs, creating examples, and making sure our guides are up to date. Experience with React and friends is an extra bonus.',
      },
    ],
  },
  benefits: {
    id: 'benefits',
    heading: <span className="text-foreground">Benefits for our members</span>,
    subheading:
      'Contributing to SupaSquad comes with real benefits. From community recognition to paid opportunities, we value your time and impact.',
    features: [
      {
        id: 'community-recognition',
        heading: 'Community Recognition',
        subheading:
          'Get a Badge on Discord and flair on Reddit showcasing your SupaSquad status in the community.',

        icon: 'award',
      },
      {
        id: 'early-access',
        heading: 'Early Access',
        subheading:
          'Get first access to new Supabase features and provide feedback directly to our team.',
        icon: 'zap',
      },
      {
        id: 'direct-team-access',
        heading: 'Direct Team Access',
        subheading:
          'Direct communication channel with Supabase team members for questions, suggestions and support.',
        icon: 'message-square',
      },
      {
        id: 'paid-contributions',
        heading: 'Paid Contributions',
        subheading:
          'We invite top contributors to get paid for their efforts. Earn while you contribute with a stipend that recognizes the value of your time and expertise.',
        icon: 'dollar-sign',
      },
      {
        id: 'exclusive-swag',
        heading: 'Exclusive SWAG',
        subheading:
          'Special Supabase merchandise reserved for SupaSquad members. Show your status with pride.',
        icon: 'gift',
      },
      {
        id: 'growth-opportunities',
        heading: 'Growth Opportunities',
        subheading:
          'Room to grow from volunteer to paid contributor to paid employee. Your path in the Supabase ecosystem.',
        icon: 'trending-up',
      },
    ],
  },
  ctaSection: {
    id: 'cta',
    title: 'Ready to make an impact?',
    primaryCta: {
      label: 'Apply to join',
      url: 'https://www.notion.so/supabase/25c5004b775f804599b7eb886a15d6b2?pvs=106',
      type: 'primary' as any,
    },
  },
}
