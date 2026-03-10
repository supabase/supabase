import {
  BarChart3,
  CalendarRange,
  Database,
  History,
  Lock,
  Network,
  Rocket,
  Timer,
} from 'lucide-react'
import Image from 'next/image'
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
      <div className="mt-8">
        <h4 className="text-lg font-bold mb-2">Smart Office project</h4>
        <p className="text-base text-foreground-light">
          In the Smart Office project, you&apos;ll learn how to build a full-featured Dashboard:
        </p>
        <div className="grid grid-cols-12 gap-12 mt-6">
          <div className="col-span-6">
            <Image
              src={'/img/smart-office.png'}
              alt="Smart Office project dashboard screenshot"
              className="w-full h-auto"
              width={1000}
              height={875}
            />
          </div>
          <div className="col-span-6">
            <ul className="grid gap-6 text-foreground-light ">
              <li className="grid grid-cols-[auto,1fr] gap-3 border-b border-border/40 pb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-500/10 text-brand-500">
                  <Timer className="h-5 w-5" />
                </span>
                <span>Real-time room monitoring that tracks live occupancy, sensor readings</span>
              </li>
              <li className="grid grid-cols-[auto,1fr] gap-3 border-b border-border/40 pb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-500/10 text-brand-500">
                  <CalendarRange className="h-5 w-5" />
                </span>
                <span>Booking management with live status filters, calendar integrations.</span>
              </li>
              <li className="grid grid-cols-[auto,1fr] gap-3 border-b border-border/40 pb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-500/10 text-brand-500">
                  <History className="h-5 w-5" />
                </span>
                <span>
                  Advanced analytics that surface 30+ days of utilization trends and patterns.
                </span>
              </li>
              <li className="grid grid-cols-[auto,1fr] gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-500/10 text-brand-500">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <span>
                  Detect capacity issues, open facilities tasks, and track resolution SLAs without
                  leaving the app.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
