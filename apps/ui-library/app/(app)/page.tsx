import { BlockPreview } from '@/components/block-preview'
import { ComponentPreview } from '@/components/component-preview'
import { Button } from '@/registry/default/components/ui/button'
export default function Home() {
  return (
    <main className="relative lg:-ml-10">
      <div className="mx-auto w-full min-w-0 flex flex-col gap-16">
        {/* Component Showcase with Grid */}
        <div className="relative z-10 h-full w-full overflow-y-auto">
          {/* Top fade effect */}
          <div className="sticky top-0 left-0 right-0 h-12 -mb-12 bg-gradient-to-b from-background to-transparent z-30"></div>

          {/* Grid Container */}
          <div className="relative">
            {/* Grid Lines - Vertical (Columns) */}
            {Array.from({ length: 13 }).map((_, i) => (
              <div
                key={`col-line-${i}`}
                className="absolute top-0 bottom-0 w-px bg-border/30 z-10"
                style={{
                  left: `${(i / 12) * 100}%`,
                  height: '100%',
                }}
              />
            ))}

            {/* Grid Lines - Horizontal (Rows) */}
            <div
              className="absolute left-0 right-0 h-px bg-border/30 z-10"
              style={{ top: '0px' }}
            ></div>
            <div
              className="absolute left-0 right-0 h-px bg-border/30 z-10"
              style={{ top: '200px' }}
            ></div>
            <div
              className="absolute left-0 right-0 h-px bg-border/30 z-10"
              style={{ top: '440px' }}
            ></div>
            <div
              className="absolute left-0 right-0 h-px bg-border/30 z-10"
              style={{ top: '740px' }}
            ></div>
            <div
              className="absolute left-0 right-0 h-px bg-border/30 z-10"
              style={{ top: '1040px' }}
            ></div>

            {/* Grid Content */}
            <div className="grid grid-cols-12 gap-0 relative z-20">
              {/* Heading Section */}
              <div data-grid-item className="col-start-3 col-span-8 pt-8 pb-8">
                <div className="flex flex-col gap-8 justify-start pt-32">
                  <div className="max-w-2xl">
                    <h1 className="text-4xl text-foreground mb-3 font-semibold tracking-tight">
                      UI Blocks for Supabase Projects
                    </h1>
                    <h2 className="text-lg text-foreground-light mb-4">
                      A set of beautifully-designed, accessible components that connect your
                      Supabase back-end to your front-end. Works with your favorite frameworks. Open
                      Source. Open Code.
                    </h2>
                    <Button variant="secondary" size="lg" className="mt-4">
                      Get Started
                    </Button>
                  </div>
                </div>
              </div>

              {/* Password-based Authentication */}
              <div
                data-grid-item
                className="col-start-3 col-span-8 pt-16 pb-4 text-xs uppercase font-mono text-muted-foreground tracking-wider"
              >
                Password-based Authentication
              </div>
              <div
                data-grid-item
                className="col-start-3 col-span-8 hover:shadow-xl transition-shadow"
              >
                <div className="w-full shadow-lg">
                  <BlockPreview name="password-based-auth/sign-up" />
                </div>
              </div>

              {/* Realtime Cursors */}
              <div
                data-grid-item
                className="col-start-3 col-span-8 pt-16 pb-4 text-xs uppercase font-mono text-muted-foreground tracking-wider"
              >
                Realtime Cursors
              </div>
              <div
                data-grid-item
                className="col-start-3 col-span-8 hover:shadow-xl transition-shadow"
              >
                <div className="w-full shadow-lg flex rounded-lg overflow-hidden">
                  <BlockPreview name="realtime-cursor" isPair />
                  <BlockPreview name="realtime-cursor" isPair />
                </div>
              </div>

              {/* Dropzone */}
              <div
                data-grid-item
                className="col-start-3 col-span-8 pt-16 pb-4 text-xs uppercase font-mono text-muted-foreground tracking-wider"
              >
                File Upload
              </div>
              <div
                data-grid-item
                className="col-start-3 col-span-8 hover:shadow-xl transition-shadow"
              >
                <div className="w-full shadow-lg">
                  <ComponentPreview name="dropzone-demo" showCode={false} />
                </div>
              </div>

              {/* Current User Avatar */}
              <div
                data-grid-item
                className="col-start-3 col-span-8 pt-16 pb-4 text-xs uppercase font-mono text-muted-foreground tracking-wider"
              >
                Current User Avatar
              </div>
              <div
                data-grid-item
                className="col-start-3 col-span-8 hover:shadow-xl transition-shadow"
              >
                <div className="w-full shadow-lg">
                  <ComponentPreview name="current-user-avatar-preview" showCode={false} />
                </div>
              </div>

              {/* Realtime Avatar Stack */}
              <div
                data-grid-item
                className="col-start-3 col-span-8 pt-16 pb-4 text-xs uppercase font-mono text-muted-foreground tracking-wider"
              >
                Realtime Avatar Stack
              </div>
              <div
                data-grid-item
                className="col-start-3 col-span-8 hover:shadow-xl transition-shadow"
              >
                <div className="w-full shadow-lg">
                  <ComponentPreview name="realtime-avatar-stack-preview" showCode={false} />
                </div>
              </div>

              {/* Empty row at bottom for padding */}
              <div data-grid-item className="col-span-12 h-16"></div>
            </div>
          </div>

          {/* Bottom fade effect */}
          <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent z-30"></div>
        </div>
      </div>
    </main>
  )
}
