'use client'

import dynamic from 'next/dynamic'
import getContent from '~/data/home/content'
import { BuiltWithSupabaseSection } from './_components/BuiltWithSupabaseSection'
import { CommunitySection } from './_components/CommunitySection'
import { CTASection } from './_components/CTASection'
import { CustomerStoriesSection } from './_components/CustomerStoriesSection'
import { DashboardFeaturesSection } from './_components/DashboardFeaturesSection'
import { FrameworksSection } from './_components/FrameworksSection'
import { Hero } from './_components/Hero'
import { LogosGrid } from './_components/LogosGrid'
import { OpenSourceSection } from './_components/OpenSourceSection'

const Products = dynamic(() => import('~/components/Products/index'))

function SectionBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={`border-b border-border ${className ?? ''}`}>{children}</section>
}

export default function HomePage() {
  const content = getContent()

  return (
    <div className="[&_.container]:!max-w-[var(--container-max-w,75rem)] [&_.container]:!px-6">
      <section>
        <Hero />
      </section>
      <SectionBlock className="border-t border-b-0 border-border relative">
        <div className="-translate-y-16">
          <Products {...content.productsSection} />
        </div>
      </SectionBlock>
      <section>
        <LogosGrid />
      </section>
      <section>
        <DashboardFeaturesSection {...content.dashboardFeatures} />
      </section>
      <section>
        <FrameworksSection />
      </section>
      <section className="border-b border-border">
        <BuiltWithSupabaseSection />
      </section>
      <section>
        <CommunitySection />
      </section>
      <section>
        <CustomerStoriesSection />
      </section>
      <section>
        <OpenSourceSection />
      </section>
      <section>
        <CTASection />
      </section>
    </div>
  )
}
