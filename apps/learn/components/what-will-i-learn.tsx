import { Database, Lock, Network, Rocket } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from 'ui'

const learningTracks = [
  {
    icon: Database,
    title: 'Model and manage your data',
    description: 'Design relational schemas, automate migrations, and keep your project tidy.',
    takeaways: [
      'set up tables, relationships, and seed data',
      'work with realtime subscriptions and triggers',
      'version and deploy database changes safely',
    ],
  },
  {
    icon: Lock,
    title: 'Secure every request',
    description: 'Master authentication and Row Level Security to keep data scoped correctly.',
    takeaways: [
      'configure supabase auth providers',
      'write row level security policies with confidence',
      'audit, monitor, and debug access issues fast',
    ],
  },
  {
    icon: Network,
    title: 'Go realtime by default',
    description: 'Stream updates into your UI with channels, presence, and edge functions.',
    takeaways: [
      'broadcast updates with realtime channels',
      'listen for database changes from the client',
      'connect edge functions to your realtime flows',
    ],
  },
  {
    icon: Rocket,
    title: 'Deploy production-grade apps',
    description: 'Integrate storage, vector search, and observability for resilient launches.',
    takeaways: [
      'serve files securely from supabase storage',
      'index and query embeddings for ai features',
      'monitor performance and scale without surprises',
    ],
  },
]

export function WhatWillILearn() {
  return (
    <section className="grid gap-8">
      <div className="grid gap-2 max-w-2xl">
        <h3 className="text-2xl font-bold mb-4">What will I learn?</h3>

        <p className="text-base text-foreground-light">
          In the fundamental courses, you&apos;ll learn all the basics:
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {learningTracks.map((track) => {
          const Icon = track.icon
          return (
            <Card key={track.title} className="h-full border-border/60">
              <CardHeader className="grid gap-2 border-b border-border/40">
                <Icon className="h-5 w-5 text-brand-500" />
                <CardTitle className="text-base font-semibold text-foreground">
                  {track.title}
                </CardTitle>
                <CardDescription className="text-sm text-foreground-light">
                  {track.description}
                </CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
