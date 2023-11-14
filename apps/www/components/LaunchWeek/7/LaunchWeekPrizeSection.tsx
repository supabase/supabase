import React from 'react'
import LabelBadge from './LabelBadge'
import LaunchWeekPrizeCard from './LaunchWeekPrizeCard'
import { motion } from 'framer-motion'

export default function LaunchWeekPrizeSection({
  className,
  ticket,
}: {
  className?: string
  ticket?: any
}) {
  const finalAnimationState = { y: 0, opacity: 1 }
  const Ticket = ticket

  return (
    <div id="lw-7-prizes" className={['scroll-mt-[75px]', className].join(' ')}>
      <div className="!max-w-[100vw]">
        <div className="text-center relative z-10 text-white">
          <motion.div
            className="max-w-[38rem] mx-auto flex flex-col items-center gap-4 px-4"
            initial={{ y: -20, opacity: 0 }}
            whileInView={finalAnimationState}
            viewport={{ once: true, margin: '-150px' }}
            transition={{ type: 'spring', bounce: 0, delay: 0.2 }}
          >
            <div className="w-[40px] h-[40px] rounded-sm bg-[#32313F] flex items-center justify-center">
              <svg
                width="21"
                height="22"
                viewBox="0 0 21 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.313 14.7478L7.5 17.5938L6.687 14.7478C6.47687 14.0126 6.0829 13.3431 5.54226 12.8025C5.00162 12.2619 4.33214 11.8679 3.597 11.6578L0.75 10.8438L3.596 10.0308C4.33114 9.82062 5.00062 9.42665 5.54126 8.88601C6.0819 8.34537 6.47587 7.67589 6.686 6.94075L7.5 4.09375L8.313 6.93975C8.52313 7.67489 8.9171 8.34437 9.45774 8.88501C9.99838 9.42565 10.6679 9.81962 11.403 10.0297L14.25 10.8438L11.404 11.6567C10.6689 11.8669 9.99938 12.2609 9.45874 12.8015C8.9181 13.3421 8.52413 14.0116 8.314 14.7467L8.313 14.7478ZM16.759 7.55875L16.5 8.59375L16.241 7.55875C16.0927 6.96534 15.786 6.42337 15.3536 5.99078C14.9212 5.55819 14.3794 5.25124 13.786 5.10275L12.75 4.84375L13.786 4.58475C14.3794 4.43626 14.9212 4.12931 15.3536 3.69672C15.786 3.26413 16.0927 2.72216 16.241 2.12875L16.5 1.09375L16.759 2.12875C16.9073 2.72229 17.2142 3.26434 17.6468 3.69694C18.0794 4.12954 18.6215 4.43642 19.215 4.58475L20.25 4.84375L19.215 5.10275C18.6215 5.25108 18.0794 5.55796 17.6468 5.99056C17.2142 6.42316 16.9073 6.96522 16.759 7.55875ZM15.394 19.4107L15 20.5938L14.606 19.4107C14.4955 19.0794 14.3094 18.7783 14.0625 18.5313C13.8155 18.2843 13.5144 18.0982 13.183 17.9877L12 17.5938L13.183 17.1998C13.5144 17.0893 13.8155 16.9032 14.0625 16.6562C14.3094 16.4092 14.4955 16.1081 14.606 15.7768L15 14.5938L15.394 15.7768C15.5045 16.1081 15.6906 16.4092 15.9375 16.6562C16.1845 16.9032 16.4856 17.0893 16.817 17.1998L18 17.5938L16.817 17.9877C16.4856 18.0982 16.1845 18.2843 15.9375 18.5313C15.6906 18.7783 15.5045 19.0794 15.394 19.4107Z"
                  stroke="url(#paint0_linear_1704_106833)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_1704_106833"
                    x1="10.5"
                    y1="1.09375"
                    x2="10.5"
                    y2="20.5938"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#7915FD" />
                    <stop offset="1" stopColor="#C667F7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className="text-4xl">
              Submissions <span className="gradient-text-pink-500">closed</span>
            </h2>
          </motion.div>
        </div>
        {ticket && <Ticket />}
        <div className="pt-4 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 col-span-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto text-white">
            <LaunchWeekPrizeCard
              imageUrl="/images/launchweek/seven/keyboard.jpg"
              imageWrapperClassName="h-[40vw] lg:max-h-[360px]"
              className="col-span-2 lg:col-span-3"
              animateFrom="left"
              content={
                <>
                  <h3 className="gradient-text-purple-500 font-mono uppercase font-medium">
                    Main award
                  </h3>
                  <h4 className="flex items-center gap-3 text-[19px] mt-4">
                    Mechanical Keyboard <LabelBadge text="3 keyboards" />
                  </h4>
                  <p className="text-[#707070] mt-1">
                    Increase your chances of winning limited edition 62-Key ISO Custom Mechanical
                    Keyboard by sharing your ticket on Twitter and LinkedIn.
                  </p>
                </>
              }
            />

            <div className="col-span-2 grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LaunchWeekPrizeCard
                  imageUrl="/images/launchweek/seven/tshirt.jpg"
                  imageWrapperClassName="h-[40vw] md:h-[30vw] lg:h-auto"
                  imgObjectPosition="right"
                  content={
                    <h3 className="text-sm flex items-center gap-4">
                      Supabase T-shirt <LabelBadge text="25 shirts" />
                    </h3>
                  }
                  animateFrom="up"
                />
                <LaunchWeekPrizeCard
                  imageUrl="/images/launchweek/seven/socks.jpg"
                  imageWrapperClassName="h-[40vw] md:h-[30vw] lg:h-auto"
                  content={
                    <h3 className="text-sm flex items-center gap-4">
                      Supabase Socks <LabelBadge text="15 pairs" />
                    </h3>
                  }
                  animateFrom="right"
                />
              </div>
              <LaunchWeekPrizeCard
                imageUrl="/images/launchweek/seven/stickers.jpg"
                imageWrapperClassName="h-[40vw] lg:h-auto"
                animateFrom="down"
                content={
                  <h3 className="text-sm flex items-center gap-4">
                    Supabase Sticker Pack <LabelBadge text="200 packs" />
                  </h3>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
