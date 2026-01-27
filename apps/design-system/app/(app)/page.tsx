import { Auth, Database, Realtime } from 'icons/src/icons'
import { Paintbrush } from 'lucide-react'
import Link from 'next/link'

import { HomepageSvgHandler } from '@/components/homepage-svg-handler'

export default function Home() {
  return (
    <div className="relative gap-4 px-6 py-6 lg:py-8">
      <div className="mx-auto w-full min-w-0 max-w-4xl flex-1">
        <div className="flex flex-col gap-2 justify-start my-8 w-full">
          <h1 className="text-2xl lg:text-4xl text-foreground">Supabase Design System</h1>
          <h2 className="md:text-xl text-base text-foreground-light font-light">
            Design resources for building consistent user experiences
          </h2>
        </div>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-4 w-full">
          <Link href="/docs/color-usage" className="h-full flex">
            <div className="p-6 gap-4 flex flex-col justify-between h-full w-full bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex flex-col gap-2 min-h-[24px]">
                <HomepageSvgHandler name="colours" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Colors</h3>
                <p className="text-sm text-foreground-light">Custom color palette for Supabase</p>
              </div>
            </div>
          </Link>

          <Link href="/docs/icons" className="h-full flex">
            <div className="p-6 gap-4 flex flex-col justify-between h-full w-full bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex items-center justify-start min-h-[24px] gap-3 text-brand">
                <Realtime className="w-5 h-5" strokeWidth={1.5} stroke="currentColor" />
                <Database className="w-5 h-5 opacity-60" strokeWidth={1.5} stroke="currentColor" />
                <Auth className="w-5 h-5 opacity-30" strokeWidth={1.5} stroke="currentColor" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Icons</h3>
                <p className="text-sm text-foreground-light">Custom icons for Supabase</p>
              </div>
            </div>
          </Link>

          <Link href="/docs/theming" className="h-full flex">
            <div className="p-6 gap-4 flex flex-col justify-between h-full w-full bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex items-center justify-start min-h-[24px] text-brand">
                <Paintbrush className="w-6 h-6" strokeWidth={1.5} stroke="currentColor" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Theming</h3>
                <p className="text-sm text-foreground-light">Simple extensible theming system</p>
              </div>
            </div>
          </Link>
          <Link href="/docs/ui-patterns/introduction" className="h-full flex">
            <div className="p-6 gap-4 flex flex-col justify-between h-full w-full bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex items-center justify-start min-h-[24px]">
                <HomepageSvgHandler name="ui-patterns" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">UI patterns</h3>
                <p className="text-sm text-foreground-light">
                  Design guidelines for common interface patterns
                </p>
              </div>
            </div>
          </Link>

          <Link href="/docs/fragments/introduction" className="h-full flex">
            <div className="p-6 gap-4 flex flex-col justify-between h-full w-full bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex items-center justify-start min-h-[24px]">
                <HomepageSvgHandler name="fragments" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Fragment components</h3>
                <p className="text-sm text-foreground-light">Components assembled from atoms</p>
              </div>
            </div>
          </Link>

          <Link href="/docs/components/introduction" className="h-full flex">
            <div className="p-6 gap-4 flex flex-col justify-between h-full w-full bg-surface-75 hover:bg-overlay/50 hover:border-foreground-muted cursor-pointer transition-all border rounded-md">
              <div className="flex items-center justify-start min-h-[24px]">
                <HomepageSvgHandler name="atoms" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Atom components</h3>
                <p className="text-sm text-foreground-light">Building blocks of user interfaces</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
