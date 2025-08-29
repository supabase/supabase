import {
  Heart,
  LifeBuoy,
  Shield,
  Award,
  Zap,
  MessageSquare,
  DollarSign,
  Gift,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { Image } from 'ui'
import { companyStats } from '~/data/company-stats'

const data = {
  metadata: {
    metaTitle: 'SupaSquad - Supabase advocate program',
    metaDescription:
      'The SupaSquad is an official Supabase advocate program where community members help build and manage the Supabase community.',
  },
  heroSection: {
    id: 'hero',
    title: 'Join the squad',
    h1: <>Be a Cornerstone of the Supabase Community</>,
    subheader: [
      <>
        Join passionate contributors who shape the entire Supabase experience. From helping
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
        authorTitle: 'SupaSquad Helper – L2',
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
        authorTitle: 'SupaSquad Advocate – L3',
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
        avatar: 'https://pbs.twimg.com/profile_images/1952929230439772161/B1ZRkVvE_bigger.jpg',
        author: 'Tomás Pozo',
        authorTitle: 'Community Support at Supabase',
        quote: (
          <>
            A year ago I was a Supabase fan <span className="text-foreground">hosting meetups</span>{' '}
            and <span className="text-foreground">helping people on Discord</span>. A few months
            later, I joined the program and{' '}
            <span className="text-foreground">
              now work full-time on the Community Support team
            </span>{' '}
            at Supabase. Taking chances contributing to the community shaped my career.
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
        Every skill has <span className="text-foreground">a place in building the future</span> of
        open source
      </>
    ),
    subheading:
      "SupaSquad recognizes that every contributor brings unique strengths, which is why we've created four distinct tracks to match how you want to make an impact. You can join one or multiple tracks based on your interests and skills.",
    features: [
      {
        id: 'advocate',
        icon: Heart,
        heading: 'Advocate',
        subheading:
          "Spread the word on social channels and help answer Supabase-related questions across the broader developer community. Your voice helps more builders discover what's possible.",
      },
      {
        id: 'helper',
        icon: LifeBuoy,
        heading: 'Helper',
        subheading:
          "Share your expertise by answering questions on GitHub Discussions, Discord, and community platforms. Help improve docs and guides that make everyone's journey smoother.",
      },
      {
        id: 'maintainer',
        icon: Wrench,
        heading: 'Maintainer',
        subheading:
          'Contribute to client libraries, manage issues, fix bugs, and improve the overall developer experience. Work directly with the core team to keep Supabase running smoothly.',
      },
      {
        id: 'moderator',
        icon: Shield,
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
      "Supabase's explosive growth means more builders need help, more opportunities to contribute, and more ways to make your mark. Join SupaSquad and help us support this thriving ecosystem of builders and innovators.",
    highlights: [
      {
        heading: 'databases managed',
        subheading: companyStats.databasesManaged,
      },
      {
        heading: 'databases launched daily',
        subheading: companyStats.databasesLaunchedDaily,
      },
    ],
  },
  benefits: {
    id: 'benefits',
    heading: <span className="text-foreground">Benefits for our members</span>,
    subheading: (
      <>
        Contributing to SupaSquad comes with <span className="text-foreground">real benefits</span>.
        From community recognition to paid opportunities,{' '}
        <span className="text-foreground">we value your time and impact.</span>
      </>
    ),
    features: [
      {
        id: 'community-recognition',
        heading: 'Community Recognition',
        subheading: (
          <>
            Badge on Discord and flair on Reddit showcasing your SupaSquad status in the community.
          </>
        ),
        icon: Award,
      },
      {
        id: 'early-access',
        heading: 'Early Access',
        subheading: (
          <>Get first access to new Supabase features and provide feedback directly to our team.</>
        ),
        icon: Zap,
      },
      {
        id: 'direct-team-access',
        heading: 'Direct Team Access',
        subheading: (
          <>
            Direct communication channel with Supabase team members for questions, suggestions and
            support.
          </>
        ),
        icon: MessageSquare,
      },
      {
        id: 'paid-contributions',
        heading: 'Paid Contributions',
        subheading: (
          <>
            Earn while you contribute with stipends that recognize the value of your time and
            expertise.
          </>
        ),
        icon: DollarSign,
      },
      {
        id: 'exclusive-swag',
        heading: 'Exclusive SWAG',
        subheading: (
          <>
            Special Supabase merchandise reserved for SupaSquad members. Show your status with
            pride.
          </>
        ),
        icon: Gift,
      },
      {
        id: 'growth-opportunities',
        heading: 'Growth Opportunities',
        subheading: (
          <>
            Room to grow from volunteer to paid contributor to paid employee. Your path in the
            Supabase ecosystem.
          </>
        ),
        icon: TrendingUp,
      },
    ],
  },
  ctaSection: {
    id: 'cta',
    title: 'Ready to make an impact?',
    primaryCta: {
      label: 'Apply to join',
      url: '#',
      type: 'primary' as any,
    },
  },
}

export default data
