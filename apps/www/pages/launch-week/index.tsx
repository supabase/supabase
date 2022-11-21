import { NextSeo } from 'next-seo'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import _days from '~/components/LaunchWeek/days.json'
import HackathonSection from '~/components/LaunchWeek/HackathonSection'
import LaunchHero from '~/components/LaunchWeek/LaunchHero'
import { LaunchSection } from '~/components/LaunchWeek/LaunchSection'
import PreLaunchTeaser from '~/components/LaunchWeek/PreLaunchTeaser'
import ScheduleInfo from '~/components/LaunchWeek/ScheduleInfo'
import { WeekDayProps } from '~/components/LaunchWeek/types'

const days = _days as WeekDayProps[]

export default function launchweek() {
  // TODO: update days json
  const shippingHasStarted = false
  const title = 'Launch Week 6'
  const description = 'Supabase Launch Week 6 | 12-18 Dec 2022'

  return (
    <>
      <NextSeo
        title={title}
        openGraph={{
          title: title,
          description: description,
          url: `https://supabase.com/launch-week`,
          images: [
            {
              url: `https://supabase.com/images/launchweek/og-image.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer className="flex flex-col !pb-0 items-center lg:pt-32 gap-8">
          <img
            src="/images/launchweek/launchweek-logo--light.svg"
            className="md:40 w-40 dark:hidden lg:w-64"
          />
          <img
            src="/images/launchweek/launchweek-logo--dark.svg"
            className="md:40 hidden w-40 dark:block lg:w-64"
          />
          <p className="text-scale-1100 text-sm">Dec 12 – 16 at 8 AM PT | 11 AM ET</p>
          {/* <LaunchHero /> */}
          {/* {!shippingHasStarted && <PreLaunchTeaser />} */}
        </SectionContainer>
        <SectionContainer className="flex flex-col gap-2 items-center max-w-[420px] text-center pb-8">
          <span className="text-scale-1200">Coming soon</span>
          <p className="text-scale-1000 text-sm">
            Register to get your ticket and stay tuned all week for daily announcements
          </p>
        </SectionContainer>
        <SectionContainer className="flex flex-col items-center !p-0">
          <form className="m-4 flex bg-scale-200 border-scale-600 border-2 rounded-full p-0.5 pl-1">
            <input
              className="mr-0 text-scale-1200 text-xs bg-scale-200 p-1 rounded-full"
              placeholder="Enter email"
            />
            <button className="px-4 py-1 rounded-full bg-scale-300 text-scale-1200 border border-scale-600 text-xs hover:bg-scale-400">
              Submit
            </button>
          </form>
        </SectionContainer>
        <div className="testGradient"></div>
        <SectionContainer
          className={[
            'grid flex-col gap-24 lg:gap-16',
            !shippingHasStarted && 'lg:grid-cols-2 ',
          ].join(' ')}
        >
          {!shippingHasStarted && <ScheduleInfo />}
          <div>
            {days.map((item: WeekDayProps, i) => {
              return (
                <LaunchSection
                  key={'launchweek-item ' + (item.title || i)}
                  {...item}
                  index={i}
                  shippingHasStarted={shippingHasStarted}
                />
              )
            })}
          </div>
        </SectionContainer>
        <SectionContainer>
          <HackathonSection />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}
