'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from 'ui'
import UnicornScene from 'unicornstudio-react/next'

import { DecorativeProgressBar } from '../components/DecorativeProgressBar'
import { SurveySectionBreak } from '../components/SurveySectionBreak'

import '../components/surveyResults.css'

import shirtImage from './shirt.png'

const Footer = dynamic(() => import('components/Footer/index'))

export function RegisterContent() {
  const [shaderLoaded, setShaderLoaded] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  return (
    <main
      className="relative w-full overflow-hidden flex flex-col"
      style={{ background: 'hsl(var(--background-alternative-default))' }}
    >
      <div>
        <header
          className="relative w-full overflow-hidden"
          style={{ minHeight: '60vh', background: 'hsl(var(--background-alternative-default))' }}
        >
          {/* Aurora shader scene — hidden when user prefers reduced motion */}
          {!prefersReducedMotion && (
            <div aria-hidden="true" className="absolute inset-0">
              <UnicornScene
                jsonFilePath={'/images/state-of-startups/aurora-dithered-shader.json'}
                width="100%"
                height="100%"
                className="w-full h-full"
                dpi={1.5}
                fps={24}
                onLoad={() => setShaderLoaded(true)}
              />
            </div>
          )}

          {/* Placeholder — visible until shader loads, fades out on load */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none transition-opacity [transition-duration:1200ms]"
            style={{
              opacity: shaderLoaded ? 0 : 1,
              background: 'hsl(var(--background-alternative-default))',
            }}
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, hsl(var(--background-alternative-default)) 0%, hsl(var(--background-alternative-default) / 0.9) 15%, transparent 90%)',
            }}
          />

          {/* Content wrapper — full height, flex col, nav top + content bottom */}
          <div className="relative z-10 flex flex-col" style={{ minHeight: '60vh' }}>
            {/* Top nav */}
            <nav className="flex items-center justify-between px-8 py-6 w-full">
              <Link
                href="/state-of-startups"
                className="font-mono uppercase tracking-wide text-sm text-white"
              >
                State of Startups 2026
              </Link>
              <Link href="/" className="text-white transition-colors ">
                supabase.com
              </Link>
            </nav>

            <div className="flex-1 hidden md:block" />

            {/* Bottom content — two columns, bottom-aligned */}
            <div className="max-w-260 mx-auto w-full px-8 pb-16 md:pb-24 pt-24 md:pt-0 grid grid-cols-1 lg:grid-cols-[auto_1fr] items-end gap-12 lg:gap-20 transition-opacity [transition-duration:1200ms]">
              <div className="flex flex-col">
                <h1 className="text-6xl md:text-8xl font-light text-foreground leading-[0.92] tracking-tight">
                  The State <br /> of Startups
                  <br />
                  <span className="text-brand-600 dark:text-brand font-medium">2026</span>
                </h1>
              </div>

              {/* Right: description + CTA */}
              <div className="flex flex-col items-start gap-6 max-w-[460px] md:justify-self-end">
                <p className="text-foreground-light text-lg md:text-pretty">
                  There's never been a better time to build. AI tools, smaller teams, faster product
                  cycles.
                </p>

                <p className="text-foreground-light text-lg md:text-pretty">
                  Over 2000 people took the survey in 2025. But a lot has changed in the last year.
                  We want to know what building at startups looks like from where you sit.
                </p>

                <Button asChild size="medium" iconRight={<ArrowRight size={12} />}>
                  <Link href="https://supabase.typeform.com/to/p2XiROl8" target="_blank">
                    Take the Survey
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* About section */}
      <SurveySectionBreak />
      <section className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 max-w-240 mx-auto md:border-x border-muted">
          {/* Left: description text */}
          <div className="md:col-span-2 flex flex-col gap-4 px-8 py-10 border-b md:border-b-0 md:border-r border-muted text-foreground text-xl md:text-2xl text-balance">
            <p>
              This is a 7-minute survey. It covers AI adoption, tech stack, GTM, and the challenges
              startups are actually facing. We'll publish the full results.
            </p>
            <p>And for your trouble, we'll send you a free Supabase t-shirt.</p>
          </div>

          <ShirtImage />
        </div>
        <SurveySectionBreak />
      </section>

      <section className="px-4 py-16 md:px-8 md:py-32">
        <div className="max-w-240 mx-auto">
          <PreviousResultsCta />
        </div>
      </section>

      <Footer />
    </main>
  )
}

function ShirtImage() {
  const [hasAppeared, setHasAppeared] = useState(false)

  return (
    <div className="flex items-center justify-center relative overflow-hidden aspect-square">
      <motion.div
        className="relative w-full h-full"
        initial={{ scale: 0.6, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{
          scale: { type: 'spring', stiffness: 260, damping: 14, delay: 1 },
          opacity: { type: 'spring', stiffness: 100, damping: 20, delay: 1 },
        }}
        onAnimationComplete={() => setHasAppeared(true)}
        style={{ willChange: 'transform' }}
      >
        <motion.div
          className="w-full h-full"
          animate={hasAppeared ? { rotate: [0, -3, 3, -2, 1, 0] } : undefined}
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 4,
            delay: 2,
          }}
        >
          <Image src={shirtImage} fill alt="Supabase Shirt" className="object-cover" />
        </motion.div>
      </motion.div>
    </div>
  )
}

function PreviousResultsCta() {
  return (
    <Link
      href="/state-of-startups-2025"
      className="group grid gap-8 transition-colors md:grid-cols-[auto_1fr_auto] md:items-end md:gap-12"
    >
      <div className="flex w-fit flex-col gap-2" aria-hidden="true">
        <div className="w-fit bg-brand-300 px-5 py-3 text-[1.75rem] leading-8 tracking-tight text-brand md:text-[2.25rem] md:leading-10">
          State
        </div>
        <div className="w-fit bg-brand-300 px-5 py-3 text-[1.75rem] leading-8 tracking-tight text-brand md:text-[2.25rem] md:leading-10">
          of
        </div>
        <div className="w-fit bg-brand px-5 py-3 text-[1.75rem] leading-8 tracking-tight text-background dark:text-brand-200 md:text-[2.25rem] md:leading-10">
          Startups
        </div>
        <div className="w-fit bg-brand-500 px-5 py-3 text-[1.75rem] leading-8 tracking-tight text-brand-300 md:text-[2.25rem] md:leading-10">
          2025
        </div>
      </div>

      <div className="flex flex-col gap-2 self-end">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-foreground-light">
          Previous Report
        </p>
        <p className="text-2xl tracking-tight text-foreground">See last year&apos;s report.</p>
      </div>

      <div className="flex items-center self-end text-foreground-light transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground md:justify-self-end">
        <ArrowRight size={18} />
      </div>
    </Link>
  )
}
