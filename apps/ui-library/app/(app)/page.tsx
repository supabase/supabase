import Link from 'next/link'
import { Button_Shadcn_ } from 'ui'

import { BlockPreview } from '@/components/block-preview'
import { ComponentPreview } from '@/components/component-preview'

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
                      UI Blocks for Supabase Projects
                    </h1>
                    <h2 className="text-lg text-foreground-light mb-4">
                      A collection of React components and blocks built on the shadcn/ui library
                      that connect your front-end to your Supabase back-end via a single command.
                    </h2>
                    <Button_Shadcn_ variant="secondary" size="lg" className="mt-4">
                      <Link href="/docs/getting-started/quickstart">Get Started</Link>
                    </Button_Shadcn_>
                  </div>
                </div>
              </div>

              {/* Password-based Authentication */}
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative flex justify-between items-center">
                <span>Password-based Authentication</span>
                <Link
                  className="text-foreground underline decoration-1 decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-brand hover:decoration-2"
                  href="/docs/nextjs/password-based-auth"
                >
                  Go to block ➔
                </Link>
              </div>
              <HorizontalGridLine />
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative">
                <div className="-mt-4">
                  <BlockPreview name="password-based-auth/auth/sign-up" />
                </div>
              </div>
              <HorizontalGridLine />

              {/* Social Authentication */}
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative flex justify-between items-center">
                <span>Social Authentication</span>
                <Link
                  className="text-foreground underline decoration-1 decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-brand hover:decoration-2"
                  href="/docs/nextjs/social-auth"
                >
                  Go to block ➔
                </Link>
              </div>
              <HorizontalGridLine />
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative">
                <div className="-mt-4">
                  <BlockPreview name="social-auth/auth/login" />
                </div>
              </div>
              <HorizontalGridLine />

              {/* Realtime Cursors */}
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative flex justify-between items-center">
                <span>Realtime Cursors</span>
                <Link
                  className="text-foreground underline decoration-1 decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-brand hover:decoration-2"
                  href="/docs/nextjs/realtime-cursor"
                >
                  Go to block ➔
                </Link>
              </div>
              <HorizontalGridLine />
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative">
                <div className="-mt-4 grid md:flex rounded-lg overflow-hidden">
                  <BlockPreview name="realtime-cursor-demo" isPair />
                  <BlockPreview name="realtime-cursor-demo" isPair />
                </div>
              </div>
              <HorizontalGridLine />

              {/* Dropzone */}
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative  flex justify-between items-center">
                <span>File Upload</span>
                <Link
                  className="text-foreground underline decoration-1 decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-brand hover:decoration-2"
                  href="/docs/nextjs/dropzone"
                >
                  Go to block ➔
                </Link>
              </div>
              <HorizontalGridLine />
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative">
                <div className="-mt-4 -mb-12">
                  <ComponentPreview name="dropzone-demo" showCode={false} />
                </div>
              </div>
              <HorizontalGridLine />

              {/* Current User Avatar */}
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative flex justify-between items-center">
                <span>Current User Avatar</span>
                <Link
                  className="text-foreground underline decoration-1 decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-brand hover:decoration-2"
                  href="/docs/nextjs/current-user-avatar"
                >
                  Go to block ➔
                </Link>
              </div>
              <HorizontalGridLine />
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative">
                <div className="-mt-4 -mb-12">
                  <ComponentPreview name="current-user-avatar-preview" showCode={false} />
                </div>
              </div>
              <HorizontalGridLine />

              {/* Realtime Avatar Stack */}
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative flex justify-between items-center">
                <span>Realtime Avatar Stack</span>
                <Link
                  className="text-foreground underline decoration-1 decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-brand hover:decoration-2"
                  href="/docs/nextjs/realtime-avatar-stack"
                >
                  Go to block ➔
                </Link>
              </div>
              <HorizontalGridLine />
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative">
                <div className="-mt-4 -mb-12">
                  <ComponentPreview name="realtime-avatar-stack-preview" showCode={false} />
                </div>
              </div>
              <HorizontalGridLine />

              {/* Realtime Chat */}
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative flex justify-between items-center">
                <span>Realtime Chat</span>
                <Link
                  className="text-foreground underline decoration-1 decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-brand hover:decoration-2"
                  href="/docs/nextjs/realtime-chat"
                >
                  Go to block ➔
                </Link>
              </div>
              <HorizontalGridLine />
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative">
                <div className="-mt-4 grid md:flex rounded-lg overflow-hidden">
                  <BlockPreview name={`realtime-chat-demo?roomName=${roomName}`} isPair />
                  <BlockPreview name={`realtime-chat-demo?roomName=${roomName}`} isPair />
                </div>
              </div>
              <HorizontalGridLine />

              {/* Infinite Query Hook */}
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative flex justify-between items-center">
                <span>Infinite Query Hook</span>
                <Link
                  className="text-foreground underline decoration-1 decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-brand hover:decoration-2"
                  href="/docs/nextjs/social-auth"
                >
                  Go to block ➔
                </Link>
              </div>
              <HorizontalGridLine />
              <div className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative">
                <div className="-mt-4">
                  <BlockPreview name="infinite-list-demo" />
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
