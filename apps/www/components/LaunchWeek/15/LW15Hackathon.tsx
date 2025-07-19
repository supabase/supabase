import React, { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { Button, cn } from 'ui'

import SectionContainer from 'components/Layouts/SectionContainer'
import { DEFAULT_EASE } from 'lib/animations'

const MotionImage = motion(Image)

const LW15Hackathon: FC = () => {
  return (
    <SectionContainer
      className="!max-w-none lg:!container lw-nav-anchor flex flex-col lg:grid lg:grid-cols-5 gap-4 lg:gap-2"
      id="build-stage"
    >
      <LW15HackathonImage className="hidden lg:flex" />
      <div className="w-full h-full flex flex-col justify-between gap-4 lg:col-span-3">
        <div className="flex flex-col h-full gap-4">
          <div className="flex flex-col text-6xl">
            <div className="flex justify-between">
              <span className="text-foreground-lighter">Hackathon</span>
            </div>
            <div>Starts this Friday.</div>
          </div>
        </div>
        <LW15HackathonImage className="lg:hidden" />
        <div className="flex flex-col justify-between items-start gap-4">
          <div className="text-2xl max-w-[350px] text-foreground-lighter">
            <p>
              Build something amazing <br /> in 10 days using Supabase.
            </p>
            <p>Compete solo or in a team, submit a quick demo and win.</p>
          </div>
          <Button type="secondary" size="medium" asChild>
            <Link href="/blog/lw15-hackathon">Join Hackathon</Link>
          </Button>
        </div>
      </div>
    </SectionContainer>
  )
}

const LW15HackathonImage = ({ className }: { className?: string }) => {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })

  const variants = {
    initial: {},
    reveal: {
      transition: {
        type: 'spring',
        damping: 10,
        mass: 0.75,
        stiffness: 100,
        staggerChildren: 0.15,
      },
    },
  }

  const imageVariants = {
    initial: {
      y: '100%',
    },
    reveal: {
      y: 0,
      transition: {
        ease: DEFAULT_EASE,
        duration: 0.5,
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      variants={variants}
      animate={isInView ? 'reveal' : 'initial'}
      className={cn(
        'flex flex-col gap-4 h-full justify-between col-span-2 min-h-[500px]',
        className
      )}
    >
      <div className="relative flex-grow-[1] overflow-hidden">
        <MotionImage
          variants={imageVariants}
          src="/images/launchweek/15/lw15-galaxy-hackathon.png"
          alt="Hackathon"
          width={1000}
          height={1000}
          quality={100}
          className="absolute w-full inset-0 h-full object-cover object-top"
        />
      </div>
      <div className="relative flex-grow-[2] overflow-hidden">
        <MotionImage
          variants={imageVariants}
          src="/images/launchweek/15/lw15-galaxy-hackathon.png"
          alt="Hackathon"
          width={1000}
          height={1000}
          quality={100}
          className="absolute w-full inset-0 h-full object-cover object-top"
        />
      </div>
      <div className="relative flex-grow-[3] overflow-hidden">
        <MotionImage
          variants={imageVariants}
          src="/images/launchweek/15/lw15-galaxy-hackathon.png"
          alt="Hackathon"
          width={1000}
          height={1000}
          quality={100}
          className="absolute w-full inset-0 h-full object-cover object-top"
        />
      </div>
    </motion.div>
  )
}

export default LW15Hackathon
