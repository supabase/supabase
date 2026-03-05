import { Realtime } from 'icons'
import {
  ArrowLeft,
  Award,
  Bot,
  Code,
  DollarSign,
  FileText,
  Gift,
  MessageCircle,
  Smartphone,
  Sparkles,
  Split,
  TrendingUp,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge, Button, Separator, cn } from 'ui'
import { GithubAvatar } from '~/components/Contribute/GithubAvatar'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { Feature, FeaturesSection as FeaturesSectionType } from '~/data/solutions/solutions.utils'

const githubUsers = [
  'aantti',
  'carolmonroe',
  'GaryAustin1',
  'Hallidayo',
  'k1ng-arthur',
  'j4w8n',
  'kallebysantos',
  'saltcod',
  'silentworks',
  'singh-inder',
  'tomaspozo',
  'tristanbob',
]

const waysToContribute = [
  {
    icon: MessageCircle,
    heading: 'Help others across the community',
    subheading:
      'Help unblock others by answering questions in Discord, GitHub Discussions, Reddit, Twitter, and StackOverflow.',
  },
  {
    icon: Code,
    heading: 'Build and maintain open source projects',
    subheading:
      'Contribute to the many open source repositories and community-driven libraries that power Supabase.',
  },
  {
    icon: FileText,
    heading: 'Write docs and guides',
    subheading:
      'Help us make Supabase easier to learn and use by improving clarity, adding examples, or filling in gaps.',
  },
  {
    icon: Sparkles,
    heading: 'Do the thing you do better than anyone',
    subheading: 'Put your unique skills, interests, or knowledge to work for the community.',
  },
]

const benefits = [
  {
    icon: DollarSign,
    heading: 'Paid contributions',
    subheading:
      'Top contributors get paid for their efforts. We pay a stipend that recognizes your time and expertise.',
  },
  {
    icon: Award,
    heading: 'Community recognition',
    subheading:
      'Get a badge on Discord and flair on Reddit showcasing your SupaSquad status in the community.',
  },
  {
    icon: Zap,
    heading: 'Early access',
    subheading:
      'Get first access to new Supabase features and provide feedback directly to our team.',
  },
  {
    icon: MessageCircle,
    heading: 'Direct team access',
    subheading:
      'Direct communication channel with Supabase team members for questions, suggestions, and support.',
  },
  {
    icon: Gift,
    heading: 'Exclusive swag',
    subheading:
      'Special Supabase merch reserved for SupaSquad members. Show your status with pride.',
  },
  {
    icon: TrendingUp,
    heading: 'Growth opportunities',
    subheading:
      'Room to grow from volunteer to paid contributor to paid employee. Your path is up to you.',
  },
]

const especially = [
  {
    id: 'expo',
    icon: Smartphone,
    heading: (
      <div className="flex items-center gap-x-3">
        Expo <Badge variant="success">Priority</Badge>
      </div>
    ),
    subheading:
      'Help the team by writing docs, creating examples, and making sure our guides are up to date.',
  },
  {
    id: 'ai',
    icon: Bot,
    heading: (
      <div className="flex items-center gap-x-3">
        AI / Vectors <Badge variant="success">Priority</Badge>
      </div>
    ),
    subheading: 'Help the team keep our AI / Vector docs and examples up to date. ',
  },
  {
    id: 'realtime',
    icon: Realtime,
    heading: 'Realtime',
    subheading:
      'Help the team by writing docs, creating examples, and making sure our guides are up to date. Experience with React is an extra bonus.',
  },
  {
    id: 'branching',
    icon: Split,
    heading: 'Branching',
    subheading:
      'Help the team by writing docs, creating examples, and making sure our guides are up to date.',
  },
]

// eslint-disable-next-line no-restricted-exports
export default function AboutPage() {
  return (
    <DefaultLayout>
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-16">
          <Link
            href="/contribute"
            className="inline-flex items-center gap-2 text-foreground-lighter hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contribute
          </Link>

          <SectionContainer
            id="mission"
            className="sm:py-18 md:py-24 lg:px-16 lg:py-24 xl:px-0 grid gap-y-4"
          >
            <h1 className="text-3xl md:text-4xl xl:text-5xl lg:max-w-2xl xl:max-w-6xl tracking-[-1px] text-foreground">
              Our mission
            </h1>
            <p className="text-xl text-foreground-light mt-4">
              We’re building a community of helpers and contributors who help developers succeed. We
              work in the open anywhere our developers are: Discord, GitHub, Reddit, Twitter, Stack
              Overflow, and more.
            </p>
          </SectionContainer>

          <Separator className="my-12 mx-auto border-foreground" />

          <FeaturesSection
            id="ways-to-contribute"
            heading="Want to get involved?"
            subheading="There are many ways to get involved in the Supabase community. Whether you want to write code, polish documentation, or help others build with Supabase, there’s a place for you."
            features={waysToContribute}
            columns={2}
          />

          <Image
            src="/images/contribute/ask-supabase.jpg"
            alt="Ask Supabase"
            width={1000}
            height={1000}
            className="rounded-md border"
          />

          <FeaturesSection
            id="benefits"
            columns={2}
            heading="Benefits for contributors"
            subheading="Becoming a contributor comes with real benefits. From community recognition to paid opportunities, we value your time and impact."
            features={benefits}
          />

          <FeaturesSection
            id="especially"
            columns={2}
            heading="We’re especially looking for..."
            subheading="These are the areas where we need the most help right now. If you have expertise in any of these domains, we’d love to hear from you."
            features={especially}
          />

          <SectionContainer id="who-are-we" className="border-b border-border xl:px-0">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-4 flex-wrap mt-2">
                {githubUsers.map((username) => (
                  <GithubAvatar
                    key={username}
                    username={username}
                    size={80}
                    className="rounded-full"
                  />
                ))}
                <div className="w-[80px] h-[80px] rounded-full bg-foreground flex items-center justify-center text-background hover:opacity-80 transition-opacity">
                  <span className="text-sm font-medium">You?</span>
                </div>
              </div>
              <div>
                <h2 className="h2 text-foreground">Who are we?</h2>
                <p className="text-lg text-foreground-lighter mt-4">
                  We are a team of developers who are passionate about building the best developer
                  platform. We help support the community on Discord, GitHub, Reddit, Twitter, and
                  anywhere else we can find them.
                </p>
              </div>
            </div>
          </SectionContainer>

          <SectionContainer id="apply" className="text-center">
            <h2 className="text-foreground text-2xl lg:text-3xl leading-tight mb-8">
              Ready to start contributing?
            </h2>

            <Button asChild type="primary" size="small">
              <Link
                href="https://supabase.notion.site/2ce5004b775f80a38acdc3ca5df7b9d3"
                target="_blank"
                rel="noopener noreferrer"
              >
                Apply to join
              </Link>
            </Button>
          </SectionContainer>
        </div>
      </main>
    </DefaultLayout>
  )
}

const FeaturesSection = ({
  id,
  label,
  heading,
  subheading,
  features,
  columns = 3,
}: FeaturesSectionType & { columns?: 2 | 3 | 4 }) => {
  return (
    <SectionContainer id={id} className="flex flex-col gap-4 md:gap-8 xl:px-0">
      <div className="flex flex-col gap-2 max-w-xl">
        {label && <span className="label">{label}</span>}
        <h2 className="h2 text-foreground">{heading}</h2>
        {subheading && (
          <p className="text-foreground-lighter text-balance text-lg mb-10">{subheading}</p>
        )}
      </div>
      <ul
        className={cn(
          'grid grid-cols-1 gap-4 gap-y-10 md:gap-12 xl:gap-20',
          columns === 2 && 'md:grid-cols-2',
          columns === 3 && 'md:grid-cols-3',
          columns === 4 && 'md:grid-cols-2 xl:grid-cols-4'
        )}
      >
        {features?.map((feature: Feature, index: number) => (
          <FeatureItem feature={feature} key={index} />
        ))}
      </ul>
    </SectionContainer>
  )
}

const FeatureItem = ({ feature }: { feature: Feature }) => {
  const Icon = feature.icon

  return (
    <li className="flex flex-col gap-2 text-sm text-foreground-lighter">
      {Icon && <Icon className="mb-2 text-current w-7 h-7" strokeWidth={1.5} />}
      <div className="w-full h-px overflow-hidden flex items-start bg-border-muted">
        <span className="h-full bg-foreground-lighter w-7" />
      </div>
      <h4 className="text-foreground text-lg lg:text-xl mt-1 text-balance">{feature.heading}</h4>
      <p className="text-foreground-lighter leading-relaxed">{feature.subheading}</p>
    </li>
  )
}
