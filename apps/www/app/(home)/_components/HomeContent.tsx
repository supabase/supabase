'use client'

import getContent from '~/data/home/content'
import dynamic from 'next/dynamic'

import { BuiltWithSupabaseSection } from './BuiltWithSupabaseSection'
import { Hero } from './Hero'

const Products = dynamic(() => import('@/components/Products/index'))
const CommunitySection = dynamic(() =>
  import('./CommunitySectionV2').then((mod) => mod.CommunitySectionV2)
)
const CTASection = dynamic(() => import('./CTASection').then((mod) => mod.CTASection))
const CustomerStoriesSection = dynamic(() =>
  import('./CustomerStoriesSection').then((mod) => mod.CustomerStoriesSection)
)
const DashboardFeaturesSection = dynamic(() =>
  import('./DashboardFeaturesSection').then((mod) => mod.DashboardFeaturesSection)
)
const LogosGrid = dynamic(() => import('./LogosGrid').then((mod) => mod.LogosGrid))
const OpenSourceSection = dynamic(() =>
  import('./OpenSourceSection').then((mod) => mod.OpenSourceSection)
)

export function HomeContent({ frameworksSlot }: { frameworksSlot: React.ReactNode }) {
  const content = getContent()

  return (
    <>
      <header>
        <Hero />
      </header>
      <section id="products" className="relative">
        <Products {...content.productsSection} />
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
