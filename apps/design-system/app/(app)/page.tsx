import { HomepageSvgHandler } from '@/components/homepage-svg-handler'
import Link from 'next/link'
import { Paintbrush } from 'lucide-react'
import { Realtime, Database, Auth } from 'icons/src/icons'

export default function Home() {
  return (
    <div className="relative gap-4 px-6 py-6 lg:py-8 lg:px-16">
      <div className="mx-auto w-full min-w-0 max-w-6xl flex flex-col gap-10">
        <div className="flex flex-col gap-2 justify-start">
          <h1 className="text-2xl lg:text-4xl text-foreground">Supabase Design System</h1>
          <h2 className="md:text-xl text-base text-foreground-light font-light">
            Design resources for building consistent user experiences
          </h2>
        </div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          <Link href="/docs/components/atom-components">
            <div className="p-6 gap-4 flex flex-col justify-between bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex items-center justify-start min-h-[24px]">
                <HomepageSvgHandler name="atoms" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Atom components</h3>
                <p className="text-sm text-foreground-light">Building blocks of User interfaces</p>
              </div>
            </div>
          </Link>
          <Link href="/docs/components/fragment-components">
            <div className="p-6 gap-4 flex flex-col justify-between bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex items-center justify-start min-h-[24px]">
                <HomepageSvgHandler name="fragments" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Fragment components</h3>
                <p className="text-sm text-foreground-light">Components assembled from Atoms</p>
              </div>
            </div>
          </Link>
          <Link href="/docs/components/ui-patterns">
            <div className="p-6 gap-4 flex flex-col justify-between bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex items-center justify-start min-h-[24px]">
                <HomepageSvgHandler name="ui-patterns" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">UI Patterns components</h3>
                <p className="text-sm text-foreground-light">
                  Components assembled from Atoms &amp; Fragments
                </p>
              </div>
            </div>
          </Link>
          <Link href="/docs/color-usage">
            <div className="p-6 gap-4 flex flex-col justify-between bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex flex-col gap-2 min-h-[24px]">
                <div className="flex items-center flex-row flex-wrap gap-2">
                  <div className="w-5 h-5 border border-brand flex-shrink-0" />
                  <div className="w-5 h-5 border border-warning flex-shrink-0" />
                  <div className="w-5 h-5 border border-destructive flex-shrink-0" />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Colors</h3>
                <p className="text-sm text-foreground-light">Building blocks of User interfaces</p>
              </div>
            </div>
          </Link>

          <Link href="/docs/theming">
            <div className="p-6 gap-4 flex flex-col justify-between bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex items-center justify-start min-h-[24px] text-brand">
                <Paintbrush className="w-6 h-6" strokeWidth={1.5} stroke="currentColor" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Theming</h3>
                <p className="text-sm text-foreground-light">Components assembled from Atoms</p>
              </div>
            </div>
          </Link>

          <Link href="/docs/icons">
            <div className="p-6 gap-4 flex flex-col justify-between bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex items-center justify-start min-h-[24px] gap-3 text-brand">
                <Realtime className="w-5 h-5" strokeWidth={1.5} stroke="currentColor" />
                <Database className="w-5 h-5 opacity-60" strokeWidth={1.5} stroke="currentColor" />
                <Auth className="w-5 h-5 opacity-30" strokeWidth={1.5} stroke="currentColor" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Icons</h3>
                <p className="text-sm text-foreground-light">Components assembled from Atoms</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
