'use client'
import Link from 'next/link'
import {
  ArrowLeft,
  MessageCircle,
  Code,
  FileText,
  Sparkles,
  DollarSign,
  Award,
  Zap,
  Gift,
  TrendingUp,
} from 'lucide-react'
import DefaultLayout from '~/components/Layouts/Default'
import { GithubAvatar } from '~/components/Contribute/GithubAvatar'
import Image from 'next/image'
import { Separator } from 'ui'
import ApplyToSupaSquadForm from '~/components/Forms/ApplyToSupaSquadForm'
import SectionContainer from '~/components/Layouts/SectionContainer'
import FeaturesSection from '~/components/Solutions/FeaturesSection'

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
      'Help unblock others by answering questions in Discord, GitHub Discussions, Reddit, Twitter, and StackOverflow. Share solutions on Reddit or StackOverflow. Help triage issues and route users to the right resources.',
  },
  {
    icon: Code,
    heading: 'Build and maintain open source projects',
    subheading:
      'Contribute to and help maintain the many open source repositories and the large ecosystem of community-driven libraries that power Supabase. Improve or extend client libraries. Contribute to open source tooling, CLIs, or utility packages. Review PRs and triage issues in GitHub.',
  },
  {
    icon: FileText,
    heading: 'Write docs and guides',
    subheading:
      'Help us make Supabase easier to learn and use by improving clarity, adding examples, or filling in gaps. Add code examples and use cases. Rewrite sections for clarity and consistency. Create new tutorials or deep-dives. Fix typos, broken links, and outdated info.',
  },
  {
    icon: Sparkles,
    heading: 'That thing you do better than anyone',
    subheading:
      "Do you have a unique skill or perspective that you can share with the community? Got a unique perspective that you can share? Got a niche skill that not many people have? Know one of our core tools better than anyone else? We'd love to hear from you.",
  },
]

const benefits = [
  {
    icon: DollarSign,
    heading: 'Paid Contributions',
    subheading:
      'Top contributors get paid for their efforts. We pay a stipend that recognizes your time and expertise.',
  },
  {
    icon: Award,
    heading: 'Community Recognition',
    subheading:
      'Get a Badge on Discord and flair on Reddit showcasing your SupaSquad status in the community.',
  },
  {
    icon: Zap,
    heading: 'Early Access',
    subheading:
      'Get first access to new Supabase features and provide feedback directly to our team.',
  },
  {
    icon: MessageCircle,
    heading: 'Direct Team Access',
    subheading:
      'Direct communication channel with Supabase team members for questions, suggestions and support.',
  },
  {
    icon: Gift,
    heading: 'Exclusive SWAG',
    subheading:
      'Special Supabase merch reserved for SupaSquad members. Show your status with pride.',
  },
  {
    icon: TrendingUp,
    heading: 'Growth Opportunities',
    subheading:
      'Room to grow from volunteer to paid contributor to paid employee. Your path is up to you.',
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

          <h1 className="sr-only">About the contributors program</h1>
          <SectionContainer id="mission" className="border-b border-border">
            <div className="grid gap-y-4">
              <div className="pb-4">
                <h2 className="h2 text-foreground">Our Mission</h2>
                <p className="text-lg text-foreground mt-4">
                  We're building a community of helpers and contributors who help developers
                  succeed. We work in the open anywhere our developers are: Discord, GitHub, Reddit,
                  Twitter, Stack Overflow, and more. We want to grow this community to reflect the
                  diversity of our users and their needs.
                </p>
                <p className="text-foreground-light mt-4">
                  One of Supabase's biggest strengths is its flexibility. You can adopt a single
                  part of the platform or use it end-to-end, and pair it with almost any framework
                  or runtime. That means you might use just the database in a SvelteKit app, or run
                  Edge Functions in a Python app. This openness enables a huge range of technical
                  combinations — and creates a broad surface area to support.
                </p>
              </div>

              <Separator className="my-12 mx-auto max-w-xl border-foreground" />

              <div className="grid md:grid-cols-2 mt-6 gap-12">
                <div>
                  <p className="text-foreground text-lg">
                    We're looking for people who can help support these many technical combinations.
                  </p>
                  <p className="text-foreground-light mt-4">We'd love to have your help!</p>
                </div>
                <Image
                  src="/images/contribute/community-combinations.png"
                  alt="Community combinations"
                  width={1000}
                  height={1000}
                  className="rounded-md border"
                />
              </div>
            </div>
          </SectionContainer>

          <FeaturesSection
            id="ways-to-contribute"
            heading={<span className="text-foreground">Want to get involved?</span>}
            subheading="There are many ways to get involved in the Supabase community. Whether you want to write code, polish documentation, or help others build with Supabase, there's a place for you."
            features={waysToContribute}
          />

          <FeaturesSection
            id="benefits"
            heading={<span className="text-foreground">Benefits for contributors</span>}
            subheading="Becoming a contributor comes with real benefits. From community recognition to paid opportunities, we value your time and impact."
            features={benefits}
          />

          <SectionContainer id="who-are-we" className="border-b border-border">
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
          <SectionContainer id="apply">
            <ApplyToSupaSquadForm />
          </SectionContainer>
        </div>
      </main>
    </DefaultLayout>
  )
}
