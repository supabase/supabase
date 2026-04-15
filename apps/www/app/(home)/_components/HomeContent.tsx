'use client'

import getContent from '~/data/home/content'
import dynamic from 'next/dynamic'

import { BuiltWithSupabaseSection } from './BuiltWithSupabaseSection'
import { CommunitySectionV2 as CommunitySection } from './CommunitySectionV2'
import { CTASection } from './CTASection'
import { CustomerStoriesSection } from './CustomerStoriesSection'
import { DashboardFeaturesSection } from './DashboardFeaturesSection'
import { Hero } from './Hero'
import { LogosGrid } from './LogosGrid'
import { OpenSourceSection } from './OpenSourceSection'

const Products = dynamic(() => import('~/components/Products/index'))

function SectionBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={`border-b border-border ${className ?? ''}`}>{children}</section>
}

export function HomeContent({ frameworksSlot }: { frameworksSlot: React.ReactNode }) {
  const content = getContent()

  return (
    <div className="[&_.container]:!max-w-[var(--container-max-w,75rem)] [&_.container]:!px-6">
      <section>
        <Hero />
      </section>
      <SectionBlock className="border-b-0 relative">
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
      <section>{frameworksSlot}</section>
      <section className="border-b border-border">
        <BuiltWithSupabaseSection />
      </section>
      <section>
        <CustomerStoriesSection />
      </section>
      <section>
        <CommunitySection />
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
