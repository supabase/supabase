import { HomepageSvgHandler } from '@/components/homepage-svg-handler'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="relative lg:gap-10 pr-6 lg:py-20">
      <div className="mx-auto w-full min-w-0 max-w-6xl flex flex-col gap-20">
        <div className="flex flex-col gap-8 justify-start">
          {/* <div>
            <DesignSystemMarks />
          </div> */}
          <div>
            <h1 className="text-4xl text-foreground mb-3">Supabase Design System</h1>
            <h2 className="text-xl text-foreground-light font-light">
              Design resources for building consistent user experiences
            </h2>
          </div>
        </div>

        {/* Homepage items */}

        <div className="grid grid-cols-2 gap-10">
          <Link href="/docs/components/atom-components">
            <div className="px-10 py-8 min-h-[18rem] flex flex-col justify-between bg-surface-75/50 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <HomepageSvgHandler name="atoms-illustration" />
              <div>
                <h3 className="font-medium text-foreground">Atom components</h3>
                <p className="text-sm text-foreground-light">Building blocks of User interfaces</p>
              </div>
            </div>
          </Link>
          <Link href="/docs/components/fragment-components">
            <div className="px-10 py-8 min-h-[18rem] flex flex-col justify-between bg-surface-75/50 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <HomepageSvgHandler name="fragments-illustration" />
              <div>
                <h3 className="font-medium text-foreground">Fragment components</h3>
                <p className="text-sm text-foreground-light">Components assembled from Atoms</p>
              </div>
            </div>
          </Link>
          <Link href="/docs/color-usage">
            <div className="px-10 py-8 min-h-[18rem] flex flex-col justify-between bg-surface-75/50 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex flex-col gap-1">
                <div className="flex flex-row gap-0.5">
                  <div className="w-3 h-16 rounded border bg-foreground"></div>
                  <div className="w-3 h-16 rounded border bg-foreground-light"></div>
                  <div className="w-3 h-16 rounded border bg-foreground-lighter"></div>
                  <div className="w-3 h-16 rounded border bg-foreground-muted"></div>
                  <div className="w-3 h-16 rounded border"></div>

                  <div className="w-3 h-16 rounded border bg"></div>
                  <div className="w-3 h-16 rounded border bg-200"></div>
                  <div className="w-3 h-16 rounded border bg-surface-75"></div>
                  <div className="w-3 h-16 rounded border bg-surface-100"></div>
                  <div className="w-3 h-16 rounded border bg-surface-200"></div>
                  <div className="w-3 h-16 rounded border bg-surface-300"></div>
                  <div className="w-3 h-16 rounded border"></div>

                  <div className="w-3 h-16 rounded border bg-brand-200"></div>
                  <div className="w-3 h-16 rounded border bg-brand-300"></div>
                  <div className="w-3 h-16 rounded border bg-brand-400"></div>
                  <div className="w-3 h-16 rounded border bg-brand-500"></div>
                  <div className="w-3 h-16 rounded border bg-brand"></div>
                  <div className="w-3 h-16 rounded border bg-brand-600"></div>
                  <div className="w-3 h-16 rounded border"></div>

                  <div className="w-3 h-16 rounded border bg-warning-200"></div>
                  <div className="w-3 h-16 rounded border bg-warning-300"></div>
                  <div className="w-3 h-16 rounded border bg-warning-400"></div>
                  <div className="w-3 h-16 rounded border bg-warning-500"></div>
                  <div className="w-3 h-16 rounded border bg-warning"></div>
                  <div className="w-3 h-16 rounded border bg-warning-600"></div>
                  <div className="w-3 h-16 rounded border"></div>

                  <div className="w-3 h-16 rounded border bg-destructive-200"></div>
                  <div className="w-3 h-16 rounded border bg-destructive-300"></div>
                  <div className="w-3 h-16 rounded border bg-destructive-400"></div>
                  <div className="w-3 h-16 rounded border bg-destructive-500"></div>
                  <div className="w-3 h-16 rounded border bg-destructive"></div>
                  <div className="w-3 h-16 rounded border bg-destructive-600"></div>
                  <div className="w-3 h-16 rounded border"></div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Colors</h3>
                <p className="text-sm text-foreground-light">Building blocks of User interfaces</p>
              </div>
            </div>
          </Link>

          <Link href="/docs/theming">
            <div className="px-10 py-8 min-h-[18rem] flex flex-col justify-between bg-surface-75/50 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <HomepageSvgHandler name="fragments-illustration" />
              <div>
                <h3 className="font-medium text-foreground">Theming</h3>
                <p className="text-sm text-foreground-light">Components assembled from Atoms</p>
              </div>
            </div>
          </Link>

          <Link href="/docs/icons">
            <div className="px-10 py-8 min-h-[18rem] flex flex-col justify-between bg-surface-75/50 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <HomepageSvgHandler name="fragments-illustration" />
              <div>
                <h3 className="font-medium text-foreground">Icons</h3>
                <p className="text-sm text-foreground-light">Components assembled from Atoms</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
