import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import classNames from 'classnames'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { SITE_ORIGIN } from '~/lib/constants'

import styleUtils from '~/components/LaunchWeek/Ticket/utils.module.css'
import styles from './launchWeek.module.css'
import Image from 'next/image'
import LabelBadge from '~/components/LaunchWeek/LabelBadge'
import TicketImage from '~/components/LaunchWeek/Ticket/ticket-image'

export default function LaunchWeek() {
  const router = useRouter()
  const { pathname } = useRouter()
  const isLauchWeekPage = pathname.includes('launch-week')

  const title = 'Launch Week 7'
  const description = 'Supabase Launch Week 6 | 3-7 April 2023'
  const liveDay = null

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
              url: `${SITE_ORIGIN}/images/launchweek/launch-week-6.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className={`${styles['bg-lw7']} -mt-16 pt-12`}>
          <SectionContainer className="flex flex-col !pb-1 items-center lg:pt-32 gap-24">
            <div
              className={classNames(
                styleUtils.appear,
                styleUtils['appear-first'],
                'flex flex-col justify-center gap-3'
              )}
            >
              <h1 className="flex gap-[24px] justify-center font-normal uppercase text-[32px] items-center">
                <span className="tracking-[4px] text-white">Launch week</span>
                <span className="flex justify-center">
                  <Image src="/images/launchweek/seven/lw7-seven.svg" width={40} height={40} />
                </span>
              </h1>
              <p className="text-white text-sm text-center">April 3rd – 7th at 6 AM PT | 9 AM ET</p>
            </div>
            <TicketImage />
          </SectionContainer>
          <div className="mt-24 relative h-[640px] overflow-hidden">
            <div className="-ml-[24rem] -mr-[24rem]">
              <Image src="/images/launchweek/seven/lw-7-bg.svg" layout="fill" objectFit="cover" />
            </div>
          </div>
          <div className="text-center -mt-56 relative z-10 text-white">
            <div className="max-w-[38rem] mx-auto">
              <Image src="/images/launchweek/seven/lw7-seven.svg" width={40} height={40} />
              <h2 className="text-4xl mt-2">
                Get your <span className="gradient-text-purple-500">winning ticket</span>
              </h2>
              <p className="mt-4 radial-gradient-text-scale-500">
                Mark your calendars for April 9th and join us on Discord for Launch Week 7's final
                day to find out if you're one of the lucky winners. Get sharing!
              </p>
            </div>
            <div className={classNames(styles['bg-lw7-black-transition'], 'h-24 ')}></div>
          </div>
          <div className="bg-black text-white">
            <div className="flex gap-4 max-w-7xl mx-auto">
              <div className=" w-3/5">
                <div className="grid gap-4 border border-[#484848]  rounded-tr-xl rounded-tl-xl overflow-hidden">
                  <div className="relative h-[360px]">
                    <Image
                      src="/images/launchweek/seven/keyboard.png"
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  <div className="p-6 mt-3">
                    <h3 className="gradient-text-purple-500 font-mono uppercase font-medium">
                      Main award
                    </h3>
                    <h4 className="flex items-center gap-3 text-[19px] mt-4">
                      <Image
                        src="/images/launchweek/seven/icons/compute-upgrade.svg"
                        width={16}
                        height={16}
                      />
                      Supabase Mechanical Keyboard <LabelBadge text="5 pieces" />
                    </h4>
                    <p className="text-scale-1100 mt-1">
                      Increase your chances of winning limited edition 62-Key ISO Custom Mechanical
                      Keyboard by sharing your ticket on Twitter.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 w-2/5">
                <div className="grid relative border border-[#484848] rounded-2xl overflow-hidden">
                  <Image src="https://placekitten.com/300/400" layout="fill" objectFit="cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black bg-opacity-50 flex ">
                    <h3 className="mt-auto mb-4 mx-6 text-lg flex items-center gap-4">
                      Limited edition sticker pack <LabelBadge text="20 packs" />
                    </h3>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="grid relative border border-[#484848] rounded-2xl overflow-hidden w-1/2">
                    <Image src="https://placekitten.com/300/400" layout="fill" objectFit="cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black bg-opacity-50 flex ">
                      <h3 className="mt-auto mb-4 mx-6 text-lg flex items-center gap-4">
                        Supa T-shirt <LabelBadge text="10 shirts" />
                      </h3>
                    </div>
                  </div>
                  <div className="grid relative border border-[#484848] rounded-2xl overflow-hidden w-1/2">
                    <Image src="https://placekitten.com/300/400" layout="fill" objectFit="cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black bg-opacity-50 flex ">
                      <h3 className="mt-auto mb-4 mx-6 text-lg flex items-center gap-4">
                        Supa socks <LabelBadge text="10 pairs" />
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}
