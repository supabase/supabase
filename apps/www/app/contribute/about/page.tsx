import Link from 'next/link'
import {
  ArrowLeft,
  MessageCircle,
  Link2,
  Code,
  BookOpen,
  User,
  LucideMessageCircleQuestion,
  MessageCircleQuestion,
} from 'lucide-react'
import DefaultLayout from '~/components/Layouts/Default'
import { Card, CardContent } from 'ui'

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

          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl  text-foreground mb-4">Want to get involved?</h1>
              <p className="text-lg text-foreground-lighter">
                There are many ways to get involved in the Supabase community. Whether you want to
                write code, polish documentation, or help others build with Supabase, there&apos;s a
                place for you.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border border-t-4 border-t-green-500">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <MessageCircle className="h-8 w-8 text-foreground" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-lg text-foreground mb-3">Help Others Across the Community</h2>
                  <p className="text-foreground-lighter mb-4">
                    A massive portion of Supabase knowledge lives in the community: Discord, GitHub
                    Discussions, Reddit, Twitter, and StackOverflow. Helping others unlock problems
                    is one of the most effective ways to strengthen the ecosystem.
                  </p>
                  <ul className="grid gap-2 text-sm text-foreground-lighter list-disc list-inside">
                    <li>Answer developer questions in Discord or GitHub</li>
                    <li>Share solutions on Reddit or StackOverflow</li>
                    <li>Help triage issues and route users to the right resources</li>
                    <li>Write quick snippets, examples, or clarifications for common problems</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card border-border border-t-4 border-t-blue-500">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <Link2 className="h-8 w-8 text-foreground" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-lg text-foreground mb-3">
                    Build and Maintain Open Source Projects
                  </h2>
                  <p className="text-foreground-lighter mb-4">
                    Supabase is powered by many open source repositories and a large ecosystem of
                    community-driven libraries. Contributors can help by fixing bugs, improving
                    performance, writing new features, or maintaining integrations that extend the
                    platform.
                  </p>
                  <ul className="grid gap-2 text-sm text-foreground-lighter list-disc list-inside">
                    <li>Improve or extend client libraries</li>
                    <li>Maintain open source SDKs</li>
                    <li>Contribute to tooling, CLIs, or utility packages</li>
                    <li>Review PRs and triage issues</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card border-border border-t-4 border-t-orange-500">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <BookOpen className="h-8 w-8 text-foreground" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-lg text-foreground mb-3">Write docs and guides</h2>
                  <p className="text-foreground-lighter mb-4">
                    Help us make Supabase easier to learn and use by improving clarity, adding
                    examples, or filling in gaps.
                  </p>
                  <ul className="grid gap-2 text-sm text-foreground-lighter list-disc list-inside">
                    <li>Add code examples and use cases</li>
                    <li>Rewrite sections for clarity and consistency</li>
                    <li>Create new tutorials or deep-dives</li>
                    <li>Fix typos, broken links, and outdated info</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-card border-border border-t-4 border-t-orange-500">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <User className="h-8 w-8 text-foreground" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-lg text-foreground mb-3">
                    That thing you do better than anyone
                  </h2>
                  <p className="text-foreground-lighter mb-4">
                    Do you have a unique skill or perspective that you can share with the community?
                    We'd love to hear from you.
                  </p>
                  <ul className="grid gap-2 text-sm text-foreground-lighter list-disc list-inside">
                    <li>
                      Got a unique skill or perspective that you can share with the community?
                    </li>
                    <li>Got a niche skill that not many people have?</li>
                    <li>Know one of our core technologies better than anyone else?</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="grid gap-4 mt-12">
            <h2 className="text-3xl text-foreground">Who are we?</h2>
            <p className="text-foreground-lighter">
              We are a team of developers who are passionate about building the best developer
              platform.
            </p>
          </div>
        </div>
      </main>
    </DefaultLayout>
  )
}
