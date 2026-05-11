'use client'

import { AnimatePresence, motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui'

const TERMINAL_LINES = [
  { text: '$ supabase functions new hello-world', delay: 0 },
  { text: 'Created function: supabase/functions/hello-world/index.ts', delay: 0.3, dim: true },
  { text: '', delay: 0.5 },
  { text: '$ supabase functions deploy hello-world', delay: 0.6 },
  { text: 'Bundling function...', delay: 0.9, dim: true },
  { text: 'Deploying to 30+ regions...', delay: 1.1, dim: true },
  { text: '', delay: 1.3 },
  { text: '✓ Function deployed:', delay: 1.4, accent: true },
  { text: '  https://your-project.supabase.co/functions/v1/hello-world', delay: 1.5, accent: true },
]

function TerminalAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const timeouts: ReturnType[] = []
    TERMINAL_LINES.forEach((line, i) => {
      timeouts.push(setTimeout(() => setVisibleCount(i + 1), line.delay * 1000))
    })
    return () => timeouts.forEach(clearTimeout)
  }, [inView])

  return (
    <div
      ref={ref}
      className="w-full max-w-xl mx-auto rounded-lg border border-border bg-surface-75 overflow-hidden"
    >
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-2 py-2 border-b border-border bg-surface-200">
        <span className="ml-2 text-xs text-foreground-muted font-mono uppercase">Terminal</span>
      </div>
      {/* Lines */}
      <div className="px-4 md:px-6 font-mono text-xs md:text-sm leading-relaxed h-[280px] flex flex-col justify-start items-start text-left pt-4">
        <AnimatePresence>
          {TERMINAL_LINES.slice(0, visibleCount).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 1 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={
                line.accent ? 'text-brand' : line.dim ? 'text-foreground-light' : 'text-foreground'
              }
            >
              {line.text || '\u00A0'}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function CTASection() {
  return (
    <div className="mx-auto max-w-[var(--container-max-w,75rem)]">
      <div className="flex flex-col items-center text-center gap-10 py-24 md:py-32 px-6">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl md:text-4xl text-foreground">
            Deploy your first function
            <span className="block text-foreground-lighter">in under a minute</span>
          </h2>
          <p className="text-foreground-lighter text-sm max-w-md">
            Two commands. Global deployment. No infrastructure to manage.
          </p>
        </div>

        <TerminalAnimation />

        <div className="flex items-center gap-2">
          <Button asChild size="medium">
            <Link href="https://supabase.com/dashboard">Start your project</Link>
          </Button>
          <Button asChild size="medium" type="default">
            <Link href="/docs/guides/functions/quickstart">Quickstart guide</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
