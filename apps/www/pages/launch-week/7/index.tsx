import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

import { LW_URL, SITE_ORIGIN } from '~/lib/constants'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { LaunchWeekLogoHeader } from '~/components/LaunchWeek/7/LaunchSection/LaunchWeekLogoHeader'
import LW7BgGraphic from '~/components/LaunchWeek/7/LW7BgGraphic'

const LW7Releases = dynamic(() => import('~/components/LaunchWeek/7/Releases'))
const LaunchWeekPrizeSection = dynamic(
  () => import('~/components/LaunchWeek/7/LaunchWeekPrizeSection')
)

const CTABanner = dynamic(() => import('~/components/CTABanner'))

export default function TicketHome() {
  const TITLE = 'Supabase LaunchWeek 7'
  const DESCRIPTION = 'Supabase Launch Week 7 | 10–14 April 2023'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/seven/launch-week-7-teaser.jpg`

  return (
    <>
      <NextSeo
        title={TITLE}
        description={DESCRIPTION}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: `${LW_URL}/7`,
          images: [
            {
              url: OG_IMAGE,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="bg-[#1C1C1C] -mt-[65px]">
          <div className="relative bg-[#9e44ef] pt-16">
            <div className="relative z-10">
              <SectionContainer className="flex flex-col justify-around items-center !py-4 md:!py-8 gap-2 md:gap-4 !px-2 !mx-auto">
                <LaunchWeekLogoHeader />
              </SectionContainer>
              <LW7BgGraphic />
            </div>
          </div>

          <div className="relative !w-full max-w-[100vw] !px-4 sm:max-w-xl md:max-w-4xl lg:max-w-7xl -mt-48 md:mt-[-460px] z-20 flex flex-col justify-around items-center !py-4 md:!py-8 gap-2 md:gap-4 !mx-auto">
            <LW7Releases />
            <LaunchWeekPrizeSection className="pt-10" />
          </div>
        </div>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}
