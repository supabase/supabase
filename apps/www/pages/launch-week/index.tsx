import { NextSeo } from 'next-seo'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TicketContainer from '~/components/LaunchWeek/Ticket/TicketContainer'
import { SITE_URL } from '~/lib/constants'
import { useRouter } from 'next/router'
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { IconArrowDown, useTheme } from 'ui'
import classNames from 'classnames'
import styles from './launchWeek.module.css'
import styleUtils from '~/components/LaunchWeek/Ticket/utils.module.css'
import Image from 'next/image'
import LabelBadge from '~/components/LaunchWeek/LabelBadge'

export default function TicketHome() {
  const { isDarkMode } = useTheme()

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const description = 'Supabase Launch Week 7 | 3-7 April 2023'
  const { query, pathname } = useRouter()
  const isLauchWeekPage = pathname.includes('launch-week')
  const ticketNumber = query.ticketNumber?.toString()

  const defaultUserData = {
    id: query.id?.toString(),
    ticketNumber: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
  }

  useEffect(() => {
    if (!supabase) {
      setSupabase(
        createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
      )
    }
  }, [])

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session)
      })

      return () => subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark bg-[#121212]' : 'light bg-[#fff]'
  }, [isDarkMode])

  return (
    <>
      <NextSeo
        title={`Get your #SupaLaunchWeek Ticket`}
        openGraph={{
          title: `Get your #SupaLaunchWeek Ticket`,
          description: description,
          url: `${SITE_URL}/tickets`,
          images: [
            {
              url: `https://supabase.com/images/launchweek/og-image.jpg`, // TODO
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className={`${styles['bg-lw7']} -mt-16 pt-12`}>
          <SectionContainer className="flex flex-col !pb-1 items-center lg:pt-32 gap-24">
            <div className="flex flex-col gap-3 items-center justify-center xl:justify-start">
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
                <p className="text-white text-sm text-center">
                  April 3rd – 7th at 6 AM PT | 9 AM ET
                </p>
              </div>
            </div>
            {supabase && (
              <TicketContainer
                supabase={supabase}
                session={session}
                defaultUserData={defaultUserData}
                defaultPageState="ticket"
              />
            )}
            <div>
              <a href="#lw-7-prizes" className="flex items-center text-white text-sm gap-4">
                More about the prizes <IconArrowDown w={10} h={12} />
              </a>
            </div>
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
              <p className="mt-4 radial-gradient-text-scale-500" id="lw-7-prizes">
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
                  <Image
                    src="/images/launchweek/seven/lw-7-bg.svg"
                    layout="fill"
                    objectFit="cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black bg-opacity-50 flex ">
                    <h3 className="mt-auto mb-4 mx-6 text-lg flex items-center gap-4">
                      Limited edition sticker pack <LabelBadge text="20 packs" />
                    </h3>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="grid relative border border-[#484848] rounded-2xl overflow-hidden w-1/2">
                    <Image
                      src="/images/launchweek/seven/lw-7-bg.svg"
                      layout="fill"
                      objectFit="cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black bg-opacity-50 flex ">
                      <h3 className="mt-auto mb-4 mx-6 text-lg flex items-center gap-4">
                        Supa T-shirt <LabelBadge text="10 shirts" />
                      </h3>
                    </div>
                  </div>
                  <div className="grid relative border border-[#484848] rounded-2xl overflow-hidden w-1/2">
                    <Image
                      src="/images/launchweek/seven/lw-7-bg.svg"
                      layout="fill"
                      objectFit="cover"
                    />
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
