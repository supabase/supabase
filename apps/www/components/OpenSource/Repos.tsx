import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { cn } from 'ui'
import LogoLoader from 'ui/src/components/LogoLoader'

import RepoCard from './RepoCard'

interface TabProps {
  label: string
  isActive: boolean
  icon?: string
  onClick: VoidFunction
}

const Tab = ({ isActive, label, icon, onClick }: TabProps) => (
  <button
    onClick={onClick}
    className={`rounded-full px-4 md:px-3 py-2 md:py-1 nowrap flex group gap-1 transition-all ${
      isActive
        ? 'text-strong bg-surface-300'
        : 'text-foreground-lighter bg-surface-200 hover:bg-overlay-hover'
    }`}
    aria-selected={isActive}
    role="tab"
  >
    <div className="flex flex-nowrap text-sm lg:text-base gap-1 lg:gap-2 items-center">
      {icon && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn('text-foreground-light shrink-0', isActive && 'text-brand')}
        >
          <path
            d={icon}
            stroke="currentColor"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="whitespace-nowrap tracking-tight lg:tracking-normal">{label}</span>
    </div>
  </button>
)

export interface RepoTab {
  label: string
  icon?: string
  repos?: string[]
}

interface Props {
  tabs: RepoTab[]
}

enum SWIPER_STATE {
  START = 'START',
  MIDDLE = 'MIDDLE',
  END = 'END',
}

const Repos = ({ tabs }: Props) => {
  const [repos, setRepos] = useState<any[] | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [apiSwiper, setApiSwiper] = useState(undefined)
  const [swiperState, setSwiperState] = useState<SWIPER_STATE>(SWIPER_STATE.START)

  useEffect(() => {
    async function fetchOctoData() {
      const { Octokit } = await import('@octokit/core')
      const octokit = new Octokit()
      const res = await octokit.request('GET /orgs/{org}/repos', {
        org: 'supabase',
        type: 'public',
        per_page: 200,
        page: 1,
      })

      setRepos(res.data)
    }
    fetchOctoData()
  }, [])

  useEffect(() => {
    if (!apiSwiper) return
    // @ts-ignore
    apiSwiper.slideTo(activeTab)
  }, [activeTab])

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex)
  }

  const activeTabRepos = repos
    ? repos
        ?.filter((repo) => tabs[activeTab].repos?.includes(repo.name))
        ?.sort((a, b) => (a.stargazers_count < b.stargazers_count ? 1 : -1))
    : []

  return (
    <div className="flex flex-col gap-8 xl:gap-10">
      <div className="flex mx-auto items-center gap-6 text-sm sm:gap-8">
        <Link
          href="https://github.com/supabase/supabase/blob/master/DEVELOPERS.md"
          className="text-foreground-lighter hover:underline flex gap-1 items-center"
          target="_blank"
        >
          <GitHubIcon />
          How to contribute
        </Link>
        <Link
          href="https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md"
          className="text-foreground-lighter hover:underline flex gap-1 items-center"
          target="_blank"
        >
          <GitHubIcon />
          Code of Conduct
        </Link>
      </div>
      <div className="w-full gap-2 flex flex-col items-center">
        <div className="relative flex border justify-center h-fit max-w-full w-full md:w-auto overflow-hidden items-center rounded-full bg-surface-100 [&_.swiper-wrapper]:w-full [&_.swiper-slide]:w-fit">
          <Swiper
            // @ts-ignore
            onSwiper={setApiSwiper}
            style={{ padding: 10 }}
            initialSlide={0}
            spaceBetween={10}
            grabCursor
            slidesPerView="auto"
            onSlideChange={(slider) =>
              setSwiperState(
                slider.isEnd
                  ? SWIPER_STATE.END
                  : slider.isBeginning
                    ? SWIPER_STATE.START
                    : SWIPER_STATE.MIDDLE
              )
            }
            className="relative flex md:hidden justify-center max-w-full w-full overflow-hidden items-center rounded-full bg-surface-100 p-2"
          >
            <div
              className={cn(
                'not-sr-only absolute inset-0 left-auto bg-gradient-to-r from-transparent to-background-surface-100 w-10 z-20 pointer-events-none opacity-0 transition-opacity',
                swiperState !== SWIPER_STATE.END && 'opacity-100'
              )}
            />
            <div
              className={cn(
                'not-sr-only absolute inset-0 right-auto bg-gradient-to-l from-transparent to-background-surface-100 w-10 z-20 pointer-events-none opacity-0 transition-opacity',
                swiperState !== SWIPER_STATE.START && 'opacity-100'
              )}
            />
            {tabs.map((tab, index) => (
              <SwiperSlide key={tab.label}>
                <Tab
                  isActive={index === activeTab}
                  label={tab.label}
                  icon={tab.icon}
                  onClick={() => handleTabClick(index)}
                />
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="hidden md:flex flex-nowrap overflow-x-scroll items-center p-2 md:p-1 gap-2 no-scrollbar">
            {tabs.map((tab, index) => (
              <Tab
                key={tab.label}
                isActive={index === activeTab}
                label={tab.label}
                icon={tab.icon}
                onClick={() => handleTabClick(index)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="relative w-full h-fit grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {repos === null ? (
            <div className="col-span-full flex justify-center items-center min-h-[300px]">
              <LogoLoader />
            </div>
          ) : (
            activeTabRepos?.map((repo: any, i: number) => (
              <RepoCard
                key={`${activeTab}-${repo.name}`}
                repo={repo}
                activeTab={activeTab}
                index={i}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const GitHubIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="fill-foreground-lighter grouopp-hover:fill-foreground"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 3.33215C7.09969 3.33215 3.12744 7.31061 3.12744 12.2198C3.12744 16.1459 5.66943 19.4775 9.19538 20.6523C9.63901 20.7339 9.80049 20.4597 9.80049 20.2237C9.80049 20.0135 9.7934 19.4536 9.78896 18.7127C7.32061 19.2495 6.79979 17.5211 6.79979 17.5211C6.39698 16.4937 5.81494 16.2204 5.81494 16.2204C5.00931 15.6703 5.87616 15.681 5.87616 15.681C6.76608 15.7431 7.23455 16.5966 7.23455 16.5966C8.02598 17.9541 9.31161 17.562 9.81646 17.3348C9.89809 16.7608 10.127 16.3695 10.3808 16.1477C8.41105 15.9232 6.33931 15.1602 6.33931 11.7549C6.33931 10.7851 6.68534 9.99101 7.25229 9.36993C7.16091 9.14545 6.85658 8.24134 7.33925 7.0187C7.33925 7.0187 8.08454 6.77914 9.7792 7.92903C10.503 7.73162 11.2498 7.63108 12 7.63002C12.7542 7.63357 13.5128 7.73206 14.2217 7.92903C15.9155 6.77914 16.659 7.01781 16.659 7.01781C17.1434 8.24134 16.8382 9.14545 16.7477 9.36993C17.3155 9.99101 17.6598 10.7851 17.6598 11.7549C17.6598 15.169 15.5845 15.9205 13.6086 16.1406C13.9271 16.4147 14.2102 16.9569 14.2102 17.7864C14.2102 18.9736 14.1995 19.9327 14.1995 20.2237C14.1995 20.4615 14.3592 20.7383 14.8099 20.6514C16.5767 20.0588 18.1126 18.9259 19.2005 17.4129C20.2884 15.8999 20.8733 14.0833 20.8726 12.2198C20.8726 7.31061 16.8994 3.33215 12 3.33215Z"
      fill="currentColor"
    />
  </svg>
)

export default Repos
