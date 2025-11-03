import { BlockPreview } from '@/components/block-preview'
import { ComponentPreview } from '@/components/component-preview'
import Link from 'next/link'
import { Button_Shadcn_ } from 'ui'
import * as React from 'react'

// Horizontal grid line component
const HorizontalGridLine = () => <div className="col-span-12 h-px bg-border/30" />

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Home() {
  const roomName = `room-${Math.floor(Math.random() * 1000)}`

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
                      Learn how to build your own projects with Supabase. Courses and projects to
                      help you get started.
                    </h2>
                    <Button_Shadcn_ variant="secondary" size="lg" className="mt-4">
                      <Link href="/docs/getting-started/quickstart">Get Started</Link>
                    </Button_Shadcn_>
                  </div>
                </div>
              </div>

              <HorizontalGridLine />
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative">
                <div className="//-mt-4">
                  <div className="w-full h-full flex items-center justify-center">
                    Chapter 1: Foundations
                  </div>
                </div>
              </div>
              <HorizontalGridLine />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
