import Link from 'next/link'
import { ArrowLeft, MessageCircle, Link2, BookOpen, User } from 'lucide-react'
import DefaultLayout from '~/components/Layouts/Default'
import { GithubAvatar } from '~/components/Contribute/GithubAvatar'

const githubUsers = ['aantti', 'carolmonroe', 'GaryAustin1', 'Hallidayo', 'ihm40', 'j4w8n', 'kallebysantos', 'saltcod', 'silentworks', 'singh-inder', 'tomaspozo', 'tristanbob']

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
          <div className="grid gap-4 mt-12">
            <h2 className="text-3xl text-foreground">Who are we?</h2>
            <p className="text-foreground-lighter">
              We are a team of developers who are passionate about building the best developer
              platform.
            </p>
            <div className="flex gap-2 flex-wrap">
              {githubUsers.map((username) => (
                <GithubAvatar key={username} username={username} size={48} className="rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </DefaultLayout>
  )
}
