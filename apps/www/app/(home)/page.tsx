'use client'

import dynamic from 'next/dynamic'
import getContent from '~/data/home/content'
import Hero from '~/components/Hero/Hero'
import Logos from '~/components/logos'

const Products = dynamic(() => import('~/components/Products/index'))
const HeroFrameworks = dynamic(() => import('~/components/Hero/HeroFrameworks'))
const CustomerStories = dynamic(() => import('components/CustomerStories'))
const BuiltWithSupabase = dynamic(() => import('components/BuiltWithSupabase'))
const DashboardFeatures = dynamic(() => import('~/components/DashboardFeatures'))
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))
const OpenSourceSection = dynamic(() => import('~/components/OpenSourceSection'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))

export default function HomePage() {
  const content = getContent()

  return (
    <>
      <Hero />
      <Logos />
      <Products {...content.productsSection} />
      <HeroFrameworks />
      <CustomerStories />
      <BuiltWithSupabase />
      <DashboardFeatures {...content.dashboardFeatures} />
      <TwitterSocialSection {...content.twitterSocialSection} />
      <OpenSourceSection />
      <CTABanner className="border-none" />
    </>
  )
}
