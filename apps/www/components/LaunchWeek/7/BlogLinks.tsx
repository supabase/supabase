import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import days from '~/components/LaunchWeek/lw7_days'

const BlogLinks = () => {
  const activeDays = days.filter((day) => Date.parse(day.publishedAt) <= Date.now())

  if (!activeDays.length) return null

  return (
    <div className="flex flex-col gap-3 lg:gap-4 border-t border-scale-400 py-4 lg:py-8 mt-4 lg:mt-8">
      <h3 className="text-black dark:text-white text-xl mb-4">More Launch Week 7</h3>
      {activeDays.map((day) =>
        day.steps?.map((step) => (
          <motion.div
            className={`h-auto w-full flex flex-col lg:flex-row relative overflow-hidden`}
            initial="default"
            animate="default"
            whileHover="hover"
          >
            <Link
              href={
                (step.blog || step.github || step.hackernews || step.blog || step.docs) as string
              }
            >
              <a
                className={`
                flex flex-col flex-1 gap-3 items-start justify-center border rounded-xl h-full relative overflow-hidden
                p-6 lg:p-10 text-2xl bg-[#1C1C1C]
                before:absolute before:w-full before:h-full before:top-52 before:right-0 before:bottom-0 before:left-0
                before:border-[#1f3536] before:-z-10
              `}
              >
                <div className="relative z-10 flex items-center text-lg flex-col-reverse lg:flex-row lg:justify-start gap-2 text-black dark:text-white">
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4FFFA] to-[#B7B2C9] drop-shadow-lg">
                    {step.title}
                  </div>
                </div>
                {/* <SectionButtons
                  // docs={step.docs}
                  blog={step.blog}
                  // youtube_id={step.youtube_id}
                /> */}
                {step.thumb && (
                  <motion.div
                    className="absolute inset-0 w-full h-full z-0"
                    variants={hoverVariant}
                  >
                    <Image
                      src={step.thumb}
                      className={`
                    absolute
                    w-full h-full -z-10 transition-all duration-300
                  `}
                      layout="fill"
                      objectPosition="100% 50%"
                      objectFit="cover"
                    />
                  </motion.div>
                )}
                <div
                  className={`absolute opacity-10 w-full h-full -z-10 transition-all duration-300`}
                  style={{
                    background: `radial-gradient(650px 150px at 50% 100%, #4635A730, transparent)`,
                  }}
                />
              </a>
            </Link>
          </motion.div>
        ))
      )}
    </div>
  )
}

const PencilSvg = () => (
  <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.21792 11.2469L11.8015 2.66333L14.0953 4.95709L5.51167 13.5407M3.21792 11.2469L2.34219 14.4164L5.51167 13.5407M3.21792 11.2469L5.51167 13.5407"
      // stroke="#6453C5"
      stroke="#A69DC9"
      strokeMiterlimit="10"
      strokeLinejoin="bevel"
    />
  </svg>
)
const DocsSvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.96289 9.48618H10.9629M4.96289 7.48618H10.9629M4.96289 11.4862H8.96289M3 2.00034V13.9998H12.9996V5.60113L9.38156 2.00034H3ZM12.9644 5.58432L9.38004 2L9.38004 5.58432L12.9644 5.58432Z"
      // stroke="#6453C5"
      stroke="#A69DC9"
      strokeMiterlimit="10"
      stroke-linejoin="bevel"
    />
  </svg>
)
const PlaySvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.4287 8L8.74762 10.7026L4.06653 13.4053L4.06653 8L4.06653 2.59474L8.74762 5.29737L13.4287 8Z"
      // stroke="#6453C5"
      stroke="#A69DC9"
      strokeMiterlimit="10"
      strokeLinejoin="bevel"
    />
  </svg>
)

const defaultEase = [0.25, 0.25, 0, 1]
const hoverVariant = {
  default: { scale: 1, ease: defaultEase, duration: 0.2 },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.4,
      ease: defaultEase,
    },
  },
}

export default BlogLinks
