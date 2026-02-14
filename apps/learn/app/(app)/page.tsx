import { WhatWillILearn } from '@/components/what-will-i-learn'
import Link from 'next/link'
import { Activity, BookOpen, Database, Gauge, Wrench } from 'lucide-react'
import { Badge, Button, Card, CardDescription, CardHeader } from 'ui'

// Horizontal grid line component
const HorizontalGridLine = () => <div className="col-span-12 h-px bg-border/30" />

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Home() {
  const courses = [
    {
      id: 1,
      title: 'Supabase Foundations',
      description: 'Learn the basics of Supabase: database, auth, and RLS.',
      chapters: 5,
      icon: Database,
      level: 'Beginner',
    },
    {
      id: 2,
      title: 'Project: Smart Office',
      description: 'Build a realtime room-booking dashboard using Supabase.',
      chapters: 15,
      icon: Activity,
      level: 'Intermediate',
    },
    {
      id: 3,
      title: 'Supabase Internals: Performance & Scaling',
      description: 'Learn how to profile queries, tune indexes, and scale Postgres with Supabase.',
      chapters: 20,
      icon: Gauge,
      level: 'Advanced',
    },
    {
      id: 4,
      title: 'Supabase Internals: Debugging & Operations',
      description:
        'Understand how to diagnose slow queries, use read replicas, and manage production workloads.',
      chapters: 20,
      icon: Wrench,
      level: 'Advanced',
    },
  ]
  return (
    <main className="relative lg:-ml-10">
      <div className="mx-auto w-full min-w-0 flex flex-col gap-16">
        {/* Component Showcase with Grid */}
        <div className="relative z-10 h-full w-full overflow-y-auto">
          {/* Grid Container */}
          <div className="relative">
            {/* Grid Lines - Vertical (Columns) */}
            {Array.from({ length: 13 }).map((_, i) => (
              <div
                key={`col-line-${i}`}
                className="absolute top-0 bottom-0 w-px bg-border/30 z-10 first:hidden last:hidden"
                style={{
                  left: `${(i / 12) * 100}%`,
                  height: '100%',
                }}
              />
            ))}

            {/* Grid Content */}
            <div className="grid grid-cols-12 gap-0 relative z-20 pb-32">
              {/* Heading Section */}
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-8 pb-8">
                <div className="flex flex-col gap-8 justify-start pt-16 md:pt-32">
                  <div className="max-w-2xl">
                    <h1 className="text-4xl text-foreground mb-3 font-medium tracking-tight">
                      Learn Supabase
                    </h1>
                    <h2 className="text-lg text-foreground-light mb-4">
                      Learn how to build your own projects with Supabase. Our courses and projects
                      help you get started no matter your skill level, teaching you how to build
                      production-ready apps.
                    </h2>
                  </div>
                </div>

                <div className="mb-8 mt-12">
                  <h3 className="text-2xl font-bold mb-6">Courses</h3>

                  <div className="space-y-4">
                    {courses.map((course) => {
                      const Icon = course.icon
                      return (
                        <Card key={course.id} className="hover:border-primary/30 transition-colors">
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-5 h-5 text-brand-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <h3 className="text-lg font-bold">{course.title}</h3>
                                  <Badge variant="secondary" className="flex-shrink-0">
                                    {course.level}
                                  </Badge>
                                </div>
                                <CardDescription className="text-sm mb-3 text-foreground-light">
                                  {course.description}
                                </CardDescription>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <BookOpen className="w-4 h-4" />
                                    <span className="text-foreground-lighter">
                                      {course.chapters} chapters
                                    </span>
                                  </div>
                                  <Button type="text" size="small" asChild>
                                    <Link href="/...">Start course ➔</Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      )
                    })}
                  </div>
                </div>
                <div className="mt-16">
                  <WhatWillILearn />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
