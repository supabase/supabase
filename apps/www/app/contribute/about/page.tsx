import Link from 'next/link'
import { ArrowLeft, MessageCircle, Link2, BookOpen, User } from 'lucide-react'
import DefaultLayout from '~/components/Layouts/Default'
import { GithubAvatar } from '~/components/Contribute/GithubAvatar'
import Image from 'next/image'

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
          <div className="flex flex-col gap-8">
            <div className="grid gap-4 mt-12 border-b border-border pb-12">
              <h2 className="text-3xl text-foreground">Our Mission</h2>
              <p className="text-lg text-foreground-lighter">
                We're building a community of helpers and contributors who help developers succeed.
                We work in the open anywhere our developers are: Discord, GitHub, Reddit, Twitter,
                Stack Overflow, and more. We want to grow this community to reflect the diversity of
                our users and their needs.
              </p>
              <p className="text-foreground-light">
                One of Supabase's biggest strengths is its flexibility. You can adopt a single part
                of the platform or use it end-to-end, and pair it with almost any framework or
                runtime. That means you might use just the database in a SvelteKit app, or run Edge
                Functions in a Python app. This openness enables a huge range of technical
                combinations — and creates a broad surface area to support.
              </p>

              <div className="grid md:grid-cols-2 mt-6 gap-12">
                <div>
                  <p className="text-foreground-light text-lg">
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
            <div>
              <h1 className="text-3xl text-foreground mb-4">Want to get involved?</h1>
              <p className="text-lg text-foreground-lighter">
                There are many ways to get involved in the Supabase community. Whether you want to
                write code, polish documentation, or help others build with Supabase, there&apos;s a
                place for you.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 md:grid-cols-[200px_1fr] gap-12 py-6 border-b border-border">
                <div>
                  <h2 className="text-xl text-foreground">Help Others Across the Community</h2>
                </div>
                <div>
                  <p className="text-foreground-lighter mb-3 text-lg">
                    Help unblock others by answering questions in Discord, GitHub Discussions,
                    Reddit, Twitter, and StackOverflow.
                  </p>
                  <ul className="grid gap-2 text-sm text-foreground-lighter list-disc list-inside ml-3">
                    <li>Answer developer questions in Discord or GitHub</li>
                    <li>Share solutions on Reddit or StackOverflow</li>
                    <li>Help triage issues and route users to the right resources</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-[200px_1fr] gap-12 py-6 border-b border-border">
                <div>
                  <h2 className="text-xl text-foreground">
                    Build and Maintain Open Source Projects
                  </h2>
                </div>
                <div>
                  <p className="text-foreground-lighter mb-3 text-lg">
                    Contribute to and help maintain the many open source repositories and the large
                    ecosystem of community-driven libraries that power Supabase.
                  </p>
                  <ul className="grid gap-2 text-sm text-foreground-lighter list-disc list-inside ml-3">
                    <li>Improve or extend client libraries</li>
                    <li>Contribute to open source tooling, CLIs, or utility packages</li>
                    <li>Review PRs and triage issues</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-[200px_1fr] gap-12 py-6 border-b border-border">
                <div>
                  <h2 className="text-xl text-foreground">Write docs and guides</h2>
                </div>
                <div>
                  <p className="text-foreground-lighter mb-3 text-lg">
                    Help us make Supabase easier to learn and use by improving clarity, adding
                    examples, or filling in gaps.
                  </p>
                  <ul className="grid gap-2 text-sm text-foreground-lighter list-disc list-inside ml-3">
                    <li>Add code examples and use cases</li>
                    <li>Rewrite sections for clarity and consistency</li>
                    <li>Create new tutorials or deep-dives</li>
                    <li>Fix typos, broken links, and outdated info</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-[200px_1fr] gap-12 py-6 border-b border-border">
                <div>
                  <h2 className="text-xl text-foreground">That thing you do better than anyone</h2>
                </div>
                <div>
                  <p className="text-foreground-lighter mb-3 text-lg">
                    Do you have a unique skill or perspective that you can share with the community?
                    We'd love to hear from you.
                  </p>
                  <ul className="grid gap-2 text-sm text-foreground-lighter list-disc list-inside ml-3">
                    <li>Got a unique perspective that you can share?</li>
                    <li>Got a niche skill that not many people have?</li>
                    <li>Know one of our core tools better than anyone else?</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-12">
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
              <h2 className="text-3xl text-foreground">Who are we?</h2>
              <p className="text-lg text-foreground-lighter mt-4">
                We are a team of developers who are passionate about building the best developer
                platform. We help support the community on Discord, GitHub, Reddit, Twitter, and
                anywhere else we can find them.
              </p>
            </div>
          </div>
        </div>
      </main>
    </DefaultLayout>
  )
}
