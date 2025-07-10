import React, { FC } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { Button, cn } from 'ui'

import SectionContainer from 'components/Layouts/SectionContainer'
import Image from 'next/image'

const LW15Hackathon: FC = () => {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })

  const variants = {
    reveal: {
      transition: {
        type: 'spring',
        damping: 10,
        mass: 0.75,
        stiffness: 100,
        staggerChildren: 0.08,
      },
    },
  }

  return (
    <>
      <SectionContainer
        className="!max-w-none lg:!container lw-nav-anchor lg:grid lg:grid-cols-5 gap-4 lg:gap-2"
        id="build-stage"
      >
        <div className="flex flex-col md:gap-4 h-full justify-between col-span-2 lg:min-h-[500px]">
          <div className="relative flex-grow-[1]">
            <Image
              src="/images/launchweek/15/lw15-galaxy-hackathon.png"
              alt="Hackathon"
              width={1000}
              height={1000}
              quality={100}
              className="absolute w-full inset-0 h-full object-cover object-top"
            />
          </div>
          <div className="relative flex-grow-[2]">
            <Image
              src="/images/launchweek/15/lw15-galaxy-hackathon.png"
              alt="Hackathon"
              width={1000}
              height={1000}
              quality={100}
              className="absolute w-full inset-0 h-full object-cover object-top"
            />
          </div>
          <div className="relative flex-grow-[3]">
            <Image
              src="/images/launchweek/15/lw15-galaxy-hackathon.png"
              alt="Hackathon"
              width={1000}
              height={1000}
              quality={100}
              className="absolute w-full inset-0 h-full object-cover object-top"
            />
          </div>
        </div>
        <div className="w-full h-full flex flex-col justify-between gap-4 lg:col-span-3">
          <div className="flex flex-col h-full gap-4">
            <div className="flex flex-col sm:flex-row justify-between text-xs gap-4">
              <div>
                Supabase <br className="hidden sm:block" />
                Hackathon 15
              </div>
              <div className="text-right">
                Starts <br className="hidden sm:block" />
                Jan 14th
              </div>
            </div>
            <div className="hidden sm:flex flex-col text-6xl">
              <div className="flex justify-between">
                <span>Step into</span>
                <span>a space</span>
              </div>
              <div>where ideas expand.</div>
            </div>
            <div className="text-6xl sm:hidden">Step into a space where ideas expand.</div>
          </div>
          <div className="flex flex-col justify-between gap-4">
            <div className="text-2xl max-w-[440px]">
              Build something amazing in 10 days using Supabase. Compete solo or in a team, submit a
              quick demo and win.
            </div>
            <div className="flex flex-col sm:flex-row justify-between text-xs gap-4">
              <Button className="h-auto py-1 px-2" type="secondary" size="medium" asChild>
                <Link href="/launch-week/ticket">Join the Hackathon</Link>
              </Button>
              <div className="text-right">
                Launch your next <br className="hidden sm:block" />
                big idea.
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </>
  )
}

export default LW15Hackathon
