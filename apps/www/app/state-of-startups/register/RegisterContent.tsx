'use client'

import { useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from 'ui'
import UnicornScene from 'unicornstudio-react/next'

import { DecorativeProgressBar } from '../components/DecorativeProgressBar'
import { SurveySectionBreak } from '../components/SurveySectionBreak'

import '../components/surveyResults.css'

const Footer = dynamic(() => import('components/Footer/index'))

export function RegisterContent() {
  return (
    <main
      className="relative w-full overflow-hidden flex flex-col"
      style={{ background: 'hsl(var(--background-alternative-default))' }}
    >
      <div className="md:h-screen">
        <header
          className="relative w-full overflow-hidden"
          style={{ minHeight: '46vh', background: 'hsl(var(--background-alternative-default))' }}
        >
          {/* Content wrapper — full height, flex col, nav top + content bottom */}
          <div className="relative z-10 flex flex-col" style={{ minHeight: '46vh' }}>
            {/* Top nav */}
            <nav className="flex items-center justify-between px-8 py-6 w-full transition-opacity [transition-duration:1200ms]">
              <Link
                href="/state-of-startups"
                className="font-mono uppercase tracking-wide text-sm text-foreground-light hover:text-foreground transition-colors"
              >
                State of Startups 2026
              </Link>
              <Link
                href="/"
                className="text-foreground-lighter hover:text-foreground transition-colors "
              >
                supabase.com
              </Link>
            </nav>

            <div className="flex-1 hidden md:block" />

            {/* Bottom content — two columns, bottom-aligned */}
            <div className="max-w-[65rem] mx-auto w-full px-8 pb-16 md:pb-24 pt-24 md:pt-0 grid grid-cols-1 md:grid-cols-2 items-end gap-8 md:gap-16 transition-opacity [transition-duration:1200ms]">
              {/* Left: eyebrow + title */}
              <div className="flex flex-col gap-3">
                <h1 className="text-4xl md:text-6xl xl:text-7xl font-light text-foreground leading-[0.92] tracking-tight">
                  The State
                  <br />
                  of Startups{' '}
                  <span className="text-brand-300 dark:text-brand font-medium">2026</span>
                </h1>
              </div>

              {/* Right: description + CTA */}
              <div className="flex flex-col items-start gap-6">
                <p className="text-foreground-light text-lg md:text-balance">
                  Data from 1,800+ startup founders on AI, tech stacks, go-to-market, and what's
                  coming next.
                </p>
                <Button asChild size="medium" iconRight={<ArrowRight size={12} />}>
                  <Link href="#">Take the Survey</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Decoration section */}
        <section className="w-full flex flex-col gap-24 pb-32 md:pb-0">
          <DecorativeProgressBar reverse={false} align={'start'} />

          <div className="hidden md:flex flex-col w-full">
            <DecorativeProgressBar reverse={true} align={'end'} />
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
