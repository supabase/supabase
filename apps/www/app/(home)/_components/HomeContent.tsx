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

export function HomeContent({ frameworksSlot }: { frameworksSlot: React.ReactNode }) {
  const content = getContent()

  return (
    <>
      <header>
        <Hero />
      </header>
      <section id="products" className="relative">
        <div className="-translate-y-16">
          <Products {...content.productsSection} />
        </div>
      </section>
      <section id="social-proof">
        <LogosGrid />
      </section>
      <section id="dashboard" className="border-b border-border">
        <DashboardFeaturesSection {...content.dashboardFeatures} />
      </section>
      <section id="frameworks">{frameworksSlot}</section>
      <section id="examples" className="border-b border-border">
        <BuiltWithSupabaseSection />
      </section>
      <section id="customer-stories">
        <CustomerStoriesSection />
      </section>
      <section id="community">
        <CommunitySection />
      </section>
      <section id="open-source" className="border-b border-border overflow-hidden">
        <OpenSourceSection />
      </section>
      <section id="cta">
        <CTASection />
      </section>
    </>
  )
}
