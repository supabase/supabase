'use client'

import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const TERMINAL_LINES = [
  { text: '$ supabase workers deploy api', delay: 0 },
  { text: 'Building from Dockerfile...', delay: 0.3, dim: true },
  { text: "Provisioning 2 GB / 1 vCPU in your database's region...", delay: 0.6, dim: true },
  { text: 'Issuing scoped project credentials...', delay: 0.9, dim: true },
  { text: '', delay: 1.1 },
  { text: '✓ Worker deployed:', delay: 1.2, accent: true },
  { text: '  https://your-project.supabase.co/workers/api', delay: 1.3, accent: true },
]

function TerminalAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const timeouts: ReturnType<typeof setTimeout>[] = []
    TERMINAL_LINES.forEach((line, i) => {
      timeouts.push(setTimeout(() => setVisibleCount(i + 1), line.delay * 1000))
    })
    return () => timeouts.forEach(clearTimeout)
  }, [inView])

  return (
    <div ref={ref} className="w-full rounded-lg border border-border bg-surface-75 overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-2 border-b border-border bg-surface-200">
        <span className="ml-2 text-xs text-foreground-muted font-mono uppercase">Terminal</span>
      </div>
      <div className="px-4 md:px-6 font-mono text-xs md:text-sm leading-relaxed h-[240px] flex flex-col justify-start items-start text-left pt-4">
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
              {line.text || ' '}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function DeploySection() {
  return (
    <SectionContainerWithCn spacing="sections">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        <div className="flex flex-col gap-4">
          <span className="text-foreground-muted font-mono text-xs uppercase tracking-widest">
            Deployment
          </span>
          <h2 className="text-2xl md:text-4xl text-foreground">
            Deploy from
            <span className="text-foreground-lighter block">wherever you work</span>
          </h2>
          <p className="text-foreground-lighter text-sm lg:text-base">
            The same deployment surface serves humans and agents: one command in a terminal, one
            tool call in an agent session, one request against the API.
          </p>
        </div>
        <TerminalAnimation />
      </div>
    </SectionContainerWithCn>
  )
}
