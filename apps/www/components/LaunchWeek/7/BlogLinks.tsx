import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import days from '~/components/LaunchWeek/7/lw7_days'

const BlogLinks = () => {
  const activeDays = days.filter((day) => Date.parse(day.publishedAt) <= Date.now())

  if (!activeDays.length) return null

  return (
    <div className="flex flex-col gap-3 lg:gap-4 border-t border-muted py-4 lg:py-8 mt-4 lg:mt-8">
      <h3 className="text-foreground text-xl mb-4">More Launch Week 7</h3>
      {activeDays.map((day) =>
        day.steps?.map((step, i) => {
          return (
            <>
              {!step.hideInBlog && <StepCard step={step} key={i} />}
              {step.steps?.map(
                (nestedStep, i) => !nestedStep.hideInBlog && <StepCard step={nestedStep} key={i} />
              )}
            </>
          )
        })
      )}
    </div>
  )
}

const StepCard = ({ step }: { step: any }) => (
  <motion.div
    className={`h-auto w-full flex flex-col lg:flex-row relative overflow-hidden`}
    initial="default"
    animate="default"
    whileHover="hover"
  >
    <Link
      href={
        (step.blog || step.github || step.hackernews || step.blog || step.docs || '#') as string
      }
      className={`
flex flex-col flex-1 gap-3 items-start justify-center border rounded-xl h-full relative overflow-hidden
p-6 lg:p-10 text-2xl bg-[#1C1C1C]
before:absolute before:w-full before:h-full before:top-52 before:right-0 before:bottom-0 before:left-0
before:border-[#1f3536] before:-z-10
`}
    >
      <div className="relative z-10 flex items-center text-lg flex-col-reverse lg:flex-row lg:justify-start gap-2 text-foreground">
        <div
          className={[
            'text-transparent bg-clip-text bg-gradient-to-r text-base from-[#F4FFFA] to-[#B7B2C9] drop-shadow-lg',
            step.break_thumb_title && 'max-w-[240px]',
          ].join(' ')}
        >
          {step.title}
        </div>
      </div>
      {step.thumb && (
        <motion.div className="absolute inset-0 w-full h-full z-0" variants={hoverVariant}>
          <Image
            src={step.thumb}
            className={`
  absolute
  w-full h-full -z-10 transition-all duration-300
`}
            layout="fill"
            objectPosition="100% 50%"
            objectFit="cover"
            alt=""
          />
        </motion.div>
      )}
      <div
        className={`absolute opacity-10 w-full h-full -z-10 transition-all duration-300`}
        style={{
          background: `radial-gradient(650px 150px at 50% 100%, #4635A730, transparent)`,
        }}
      />
    </Link>
  </motion.div>
)

const defaultEase = [0.5, 0, 0.35, 1]
const hoverVariant = {
  default: { scale: 1, ease: defaultEase, duration: 0.2 },
  hover: {
    scale: 1.03,
    transition: {
      duration: 0.4,
      ease: defaultEase,
    },
  },
}

export default BlogLinks
