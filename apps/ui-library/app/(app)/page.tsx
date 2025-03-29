import { BlockPreview } from '@/components/block-preview'
import { ComponentPreview } from '@/components/component-preview'
import Link from 'next/link'
import { Button_Shadcn_ } from 'ui'

// Horizontal grid line component
const HorizontalGridLine = () => <div className="col-span-12 h-px bg-border/30" />

export default function Home() {
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
              <div
                data-grid-item
                className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-8 pb-8"
              >
                <div className="flex flex-col gap-8 justify-start pt-32">
                  <div className="max-w-2xl">
                    <h1 className="text-4xl text-foreground mb-3 font-medium tracking-tight">
                      UI Blocks for Supabase Projects
                    </h1>
                    <h2 className="text-lg text-foreground-light mb-4">
                      A set of beautifully-designed, accessible components that connect your
                      Supabase back-end to your front-end. Works with your favorite frameworks. Open
                      Source. Open Code.
                    </h2>
                    <Button_Shadcn_ variant="secondary" size="lg" className="mt-4">
                      <Link href="/docs/getting-started/quickstart">Get Started</Link>
                    </Button_Shadcn_>
                  </div>
                </div>
              </div>

              {/* Password-based Authentication */}
              <div
                data-grid-item
                className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative"
              >
                Password-based Authentication
              </div>
              <HorizontalGridLine />
              <div
                data-grid-item
                className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative"
              >
                <div className="-mt-4">
                  <BlockPreview name="password-based-auth/auth/sign-up" />
                </div>
              </div>
              <HorizontalGridLine />

              {/* Realtime Cursors */}
              <div
                data-grid-item
                className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative"
              >
                Realtime Cursors
              </div>
              <HorizontalGridLine />
              <div
                data-grid-item
                className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative"
              >
                <div className="-mt-4 flex rounded-lg overflow-hidden">
                  <BlockPreview name="realtime-cursor" isPair />
                  <BlockPreview name="realtime-cursor" isPair />
                </div>
              </div>
              <HorizontalGridLine />

              {/* Dropzone */}
              <div
                data-grid-item
                className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative"
              >
                File Upload
              </div>
              <HorizontalGridLine />
              <div
                data-grid-item
                className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative"
              >
                <div className="-mt-4 -mb-12">
                  <ComponentPreview name="dropzone-demo" showCode={false} />
                </div>
              </div>
              <HorizontalGridLine />

              {/* Current User Avatar */}
              <div
                data-grid-item
                className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative"
              >
                Current User Avatar
              </div>
              <HorizontalGridLine />
              <div
                data-grid-item
                className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative"
              >
                <div className="-mt-4 -mb-12">
                  <ComponentPreview name="current-user-avatar-preview" showCode={false} />
                </div>
              </div>
              <HorizontalGridLine />

              {/* Realtime Avatar Stack */}
              <div
                data-grid-item
                className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 pt-16 pb-6 text-xs uppercase font-mono text-foreground-light tracking-wider relative"
              >
                Realtime Avatar Stack
              </div>
              <HorizontalGridLine />
              <div
                data-grid-item
                className="col-start-2 col-span-10 md:col-start-3 md:col-span-8 relative"
              >
                <div className="-mt-4 -mb-12">
                  <ComponentPreview name="realtime-avatar-stack-preview" showCode={false} />
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
