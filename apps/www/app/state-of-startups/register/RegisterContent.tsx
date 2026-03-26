'use client'

import { ArrowRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from 'ui'
import UnicornScene from 'unicornstudio-react/next'

export function RegisterContent() {
  return (
    <main
      className="relative w-full min-h-screen overflow-hidden flex flex-col items-center"
      style={{ background: 'hsl(var(--background-alternative-default))' }}
    >
      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 w-full transition-opacity [transition-duration:1200ms]">
        <Link
          href="/state-of-startups"
          className="font-mono uppercase tracking-wide text-sm text-foreground-light hover:text-foreground transition-colors"
        >
          State of Startups 2026
        </Link>
        <Link
          href="/"
          className="text-foreground-lighter hover:text-foreground transition-colors text-sm"
        >
          supabase.com
        </Link>
      </nav>

      {/* Center content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 gap-8 w-fit h-auto transition-opacity [transition-duration:1200ms]">
        <div className="relative flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-6 max-w-xl">
            <div className="flex flex-col gap-2">
              <p className="font-mono uppercase tracking-wide text-sm text-foreground">
                Supabase Presents
              </p>
              <h1 className="text-5xl md:text-6xl xl:text-7xl font-light text-foreground leading-[0.92] tracking-tight text-balance">
                The State of Startups{' '}
                <span className="text-brand-300 dark:text-brand font-medium">2026</span>
              </h1>
            </div>

            <p className="text-foreground text-lg text-balance max-w-sm">
              Data from 1,800+ startup founders on AI, tech stacks, go-to-market, and what's coming
              next.
            </p>
          </div>

          <Button
            asChild
            size="medium"
            type={'default'}
            className="!border-none dark:bg-background-alternative dark:hover:bg-background-alternative-200"
            iconRight={<ArrowRight size={12} />}
          >
            <Link href="#">Take the Survey</Link>
          </Button>
        </div>
      </div>

      {/* Bottom brand */}
      <div className="relative z-10 flex items-center justify-center px-8 py-6 transition-opacity [transition-duration:1200ms]">
        <p className="text-foreground-muted text-xs font-mono uppercase tracking-widest">
          A Supabase Report from all startups in the world.
        </p>
      </div>
    </main>
  )
}
