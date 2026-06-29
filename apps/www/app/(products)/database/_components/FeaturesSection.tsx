'use client'

import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { AnimatePresence, motion } from 'framer-motion'
import { Key } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

import { PostgresGlow } from './Shaders/PostgresGlow'

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn('rounded bg-foreground-muted/10', className)} />
}

const FEATURES = [
  {
    title: 'Just Postgres',
    description: 'A dedicated Postgres database.',
    detail: '100% portable. Bring your existing Postgres database, or migrate away at any time.',
    visual: PostgresSkeleton,
  },
  {
    title: 'Secure by default',
    description: "Built on Postgres' proven Row Level Security.",
    detail: 'Integrated with JWT authentication which controls exactly what your users can access.',
    visual: RLSSkeleton,
  },
  {
    title: 'Realtime enabled',
    description: 'Data-change listeners over websockets.',
    detail: 'Subscribe and react to database changes, milliseconds after they happen.',
    visual: RealtimeSkeleton,
  },
]

function PostgresSkeleton() {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      role="img"
      aria-label="Postgres elephant logo illustration"
      className="flex items-center justify-center w-full h-full relative"
      style={{
        maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 30%, transparent 75%)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Abstract construction lines behind the elephant */}
      <svg
        aria-hidden
        className="absolute -inset-16 w-[calc(100%+128px)] h-[calc(100%+128px)] text-foreground-muted/20"
        viewBox="0 0 480 480"
        fill="none"
      >
        <rect
          x="60"
          y="40"
          width="360"
          height="400"
          rx="48"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <rect
          x="30"
          y="10"
          width="420"
          height="460"
          rx="60"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <rect
          x="0"
          y="-16"
          width="480"
          height="512"
          rx="72"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <rect
          x="90"
          y="70"
          width="300"
          height="340"
          rx="36"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <line x1="30" y1="10" x2="450" y2="470" stroke="currentColor" strokeWidth="0.5" />
        <line x1="450" y1="10" x2="30" y2="470" stroke="currentColor" strokeWidth="0.5" />
        <line x1="240" y1="0" x2="240" y2="480" stroke="currentColor" strokeWidth="0.5" />
        <line x1="0" y1="240" x2="480" y2="240" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="240" cy="240" r="180" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="240" cy="240" r="140" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="240" cy="240" r="100" stroke="currentColor" strokeWidth="0.5" />
        <line x1="60" y1="40" x2="60" y2="10" stroke="currentColor" strokeWidth="0.5" />
        <line x1="60" y1="40" x2="30" y2="40" stroke="currentColor" strokeWidth="0.5" />
        <line x1="420" y1="40" x2="450" y2="40" stroke="currentColor" strokeWidth="0.5" />
        <line x1="420" y1="40" x2="420" y2="10" stroke="currentColor" strokeWidth="0.5" />
        <line x1="60" y1="440" x2="30" y2="440" stroke="currentColor" strokeWidth="0.5" />
        <line x1="60" y1="440" x2="60" y2="470" stroke="currentColor" strokeWidth="0.5" />
        <line x1="420" y1="440" x2="450" y2="440" stroke="currentColor" strokeWidth="0.5" />
        <line x1="420" y1="440" x2="420" y2="470" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      {/* Highlighted lines on hover */}
      <svg
        aria-hidden
        className="absolute -inset-16 w-[calc(100%+128px)] h-[calc(100%+128px)] transition-opacity duration-500"
        style={{ opacity: hovered ? 0.35 : 0 }}
        viewBox="0 0 480 480"
        fill="none"
      >
        <rect
          x="60"
          y="40"
          width="360"
          height="400"
          rx="48"
          stroke="hsl(var(--brand-default))"
          strokeWidth="0.75"
          opacity="0.4"
        />
        <circle
          cx="240"
          cy="240"
          r="140"
          stroke="hsl(var(--brand-default))"
          strokeWidth="0.75"
          opacity="0.3"
        />
        <line
          x1="240"
          y1="0"
          x2="240"
          y2="480"
          stroke="hsl(var(--brand-default))"
          strokeWidth="0.75"
          opacity="0.25"
        />
        <line
          x1="0"
          y1="240"
          x2="480"
          y2="240"
          stroke="hsl(var(--brand-default))"
          strokeWidth="0.75"
          opacity="0.25"
        />
      </svg>

      <div className="relative w-80 h-80">
        <PostgresGlow hovered={hovered} />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 390 430"
          className="w-80 h-80 relative z-[5]"
          style={{
            color: hovered ? 'hsl(var(--brand-default))' : 'hsl(var(--foreground-muted))',
            opacity: hovered ? 1 : 0.8,
            transition: 'color 0.5s, opacity 0.5s',
          }}
        >
          <path
            stroke="currentColor"
            strokeWidth="1.5"
            d="M192.144 125.816h-53.465c-8.506 0-16.159 5.17-19.334 13.061L99.0045 189.43c-3.0613 7.608-1.3448 16.306 4.3775 22.181l10.232 10.506c4.792 4.919 7.474 11.516 7.474 18.384l-.001 14.473c0 20.197 16.373 36.569 36.569 36.569 6.16 0 11.154-4.993 11.154-11.153l.001-86.241c0-18.629 7.441-36.486 20.668-49.602 2.746-2.723 7.178-2.704 9.9.041 2.722 2.745 2.703 7.178-.042 9.9-10.577 10.488-16.526 24.766-16.526 39.661l-.001 86.241c0 13.892-11.262 25.153-25.154 25.153-27.928 0-50.569-22.64-50.569-50.569l.001-14.474c0-3.218-1.257-6.309-3.503-8.615L93.353 221.38c-9.5904-9.847-12.4673-24.424-7.3366-37.176l20.3406-50.553c5.308-13.192 18.101-21.835 32.322-21.835h55.729v.084h10.339c49.104 0 88.91 39.806 88.91 88.91v50.842c0 3.866-3.134 7-7 7s-7-3.134-7-7V200.81c0-41.372-33.538-74.91-74.91-74.91H193.23c-.37 0-.732-.029-1.086-.084Z"
          />
          <path
            stroke="currentColor"
            strokeWidth="1.5"
            d="M210.03 283.94c0-3.866-3.134-7-7-7s-7 3.134-7 7v3.113c0 26.959 21.854 48.814 48.813 48.814 26.351 0 47.825-20.879 48.781-46.996h24.614c3.866 0 7-3.134 7-7s-3.134-7-7-7h-26.841c-30.744 0-60.256-12.083-82.173-33.643-2.756-2.711-7.188-2.675-9.899.081-2.711 2.756-2.675 7.188.081 9.9 21.725 21.371 50.116 34.423 80.228 37.134-.679 18.629-15.995 33.524-34.791 33.524-19.227 0-34.813-15.587-34.813-34.814v-3.113Z"
          />
          <path
            stroke="currentColor"
            strokeWidth="1.5"
            d="M238.03 202.145c0 4.792 3.885 8.677 8.677 8.677s8.676-3.885 8.676-8.677-3.884-8.676-8.676-8.676-8.677 3.884-8.677 8.676Z"
          />
        </svg>
      </div>
    </div>
  )
}

const rlsPolicies = [
  { name: 'Users can read their own profile', op: 'SELECT', clause: 'auth.uid() = id' },
  { name: 'Users can update their own data', op: 'UPDATE', clause: 'auth.uid() = id' },
  { name: 'Users can delete their own posts', op: 'DELETE', clause: 'auth.uid() = id' },
]

const rlsColumns = [
  { name: 'id', format: 'int8', isPrimaryKey: true },
  { name: 'email', format: 'text' },
  { name: 'role', format: 'text' },
]

const rlsRows = [
  { id: '1', email: 'alice@company.com', role: 'admin' },
  { id: '2', email: 'bob@company.com', role: 'user' },
]

function RLSSkeleton() {
  const [policyIdx, setPolicyIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.3,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return
    const timer = setInterval(() => setPolicyIdx((i) => (i + 1) % rlsPolicies.length), 10000)
    return () => clearInterval(timer)
  }, [isInView])

  const policy = rlsPolicies[policyIdx]

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col justify-end">
      <div
        className="absolute top-12 -right-24"
        style={{
          maskImage: 'linear-gradient(to right, black 35%, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to right, black 35%, transparent 70%)',
        }}
      >
        <div className="border border-border rounded-lg overflow-hidden" style={{ maxHeight: 180 }}>
          <table className="w-full border-collapse text-[13px] !mt-0" style={{ minWidth: 360 }}>
            <thead>
              <tr className="bg-surface-200">
                {rlsColumns.map((col) => (
                  <th
                    key={col.name}
                    className="border-b border-r last:border-r-0 border-default px-3 py-1.5 text-left font-normal"
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {col.isPrimaryKey && (
                        <Key size={12} strokeWidth={2} className="text-brand rotate-45 shrink-0" />
                      )}
                      <span className="text-foreground text-xs truncate font-medium">
                        {col.name}
                      </span>
                      <span className="text-foreground-light text-xs truncate">{col.format}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rlsRows.map((row) => (
                <tr key={row.id} className="border-b border-default last:border-b-0 bg-surface-75">
                  <td className="border-r border-default px-3 py-1.5 text-foreground-muted text-xs">
                    {row.id}
                  </td>
                  <td className="border-r border-default px-3 py-1.5 text-foreground text-xs">
                    {row.email}
                  </td>
                  <td className="px-3 py-1.5 text-foreground-muted text-xs">{row.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL snippet — bottom left */}
      <div className="px-6 pb-4">
        <pre className="text-sm leading-relaxed font-mono text-[#525252] dark:text-white overflow-hidden">
          <span className="text-[#6b35dc] dark:text-[#bda4ff]">CREATE POLICY</span>
          {'\n'}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={policy.name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="inline-block text-[#f1a10d] dark:text-[#ffcda1]"
            >
              &quot;{policy.name}&quot;
            </motion.span>
          </AnimatePresence>
          {'\n'}
          <span className="text-[#6b35dc] dark:text-[#bda4ff]">ON</span>
          {' public.users\n'}
          <span className="text-[#6b35dc] dark:text-[#bda4ff]">FOR </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={policy.op}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="inline-block text-[#6b35dc] dark:text-[#bda4ff]"
            >
              {policy.op}
            </motion.span>
          </AnimatePresence>{' '}
          <span className="text-[#6b35dc] dark:text-[#bda4ff]">USING</span>
          {'\n  ('}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={policy.clause}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              {policy.clause}
            </motion.span>
          </AnimatePresence>
          {');'}
        </pre>
      </div>
    </div>
  )
}

type ChatMsg = { id: number; user: string; text: string }

const initialMessages: ChatMsg[] = [
  { id: 1, user: 'Alice', text: 'Hey, is the deploy ready?' },
  { id: 2, user: 'Bob', text: 'Almost — running final tests now.' },
  { id: 3, user: 'Alice', text: 'Nice, let me know when it\u2019s live.' },
]

const incomingMessages: ChatMsg[] = [
  { id: 4, user: 'Bob', text: 'All green. Deploying now  🚀' },
  { id: 5, user: 'Alice', text: 'Awesome, checking it out.' },
  { id: 6, user: 'Bob', text: 'Latency dropped to 42ms!' },
  { id: 7, user: 'Alice', text: 'That\u2019s a big improvement.' },
  { id: 8, user: 'Bob', text: 'Yeah, the new index helped.' },
  { id: 9, user: 'Alice', text: 'Should we update the docs?' },
  { id: 10, user: 'Bob', text: 'Already on it.' },
]

const chatCols = ['id', 'user', 'text'] as const

function RealtimeSkeleton() {
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages)
  const [tableFlashId, setTableFlashId] = useState<number | null>(null)
  const [chatFlashId, setChatFlashId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const nextMsgIdx = useRef(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.3,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return

    const timer = setInterval(() => {
      const msg = incomingMessages[nextMsgIdx.current % incomingMessages.length]
      // Give each added message a unique id
      const newMsg = { ...msg, id: Date.now() + nextMsgIdx.current }
      nextMsgIdx.current++

      // Add to table + flash
      setMessages((prev) => [...prev, newMsg])
      setTableFlashId(newMsg.id)

      // Autoscroll table
      requestAnimationFrame(() => {
        tableScrollRef.current?.scrollTo({
          top: tableScrollRef.current.scrollHeight,
          behavior: 'smooth',
        })
      })

      // Chat updates after short delay (realtime propagation)
      setTimeout(() => {
        setChatFlashId(newMsg.id)
        requestAnimationFrame(() => {
          chatScrollRef.current?.scrollTo({
            top: chatScrollRef.current.scrollHeight,
            behavior: 'smooth',
          })
        })
        setTimeout(() => {
          setTableFlashId(null)
          setChatFlashId(null)
        }, 600)
      }, 200)
    }, 3000)

    return () => clearInterval(timer)
  }, [isInView])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col justify-end"
      style={{
        maskImage:
          'linear-gradient(to bottom, black 50%, rgba(0,0,0,0.9) 65%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.1) 85%, transparent 90%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, black 50%, rgba(0,0,0,0.9) 65%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.1) 85%, transparent 90%)',
      }}
    >
      <div
        className="absolute top-12 -right-24 z-[2]"
        style={{
          maskImage: 'linear-gradient(to right, black 35%, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to right, black 35%, transparent 70%)',
        }}
      >
        <div
          className="border border-border rounded-lg overflow-hidden bg-surface-75"
          style={{ width: 420 }}
        >
          <table className="w-full border-collapse text-[13px] !mt-0 table-fixed">
            <colgroup>
              <col style={{ width: 72 }} />
              <col style={{ width: 100 }} />
              <col />
            </colgroup>
            <thead>
              <tr className="bg-surface-200">
                <th className="border-b border-r border-default px-3 py-1.5 text-left font-normal">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <Key size={12} strokeWidth={2} className="text-brand rotate-45 shrink-0" />
                    <span className="text-foreground text-xs font-medium">id</span>
                    <span className="text-foreground-light text-xs">int8</span>
                  </div>
                </th>
                <th className="border-b border-r border-default px-3 py-1.5 text-left font-normal">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-foreground text-xs font-medium">user</span>
                    <span className="text-foreground-light text-xs">text</span>
                  </div>
                </th>
                <th className="border-b border-default px-3 py-1.5 text-left font-normal">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-foreground text-xs font-medium">text</span>
                    <span className="text-foreground-light text-xs">text</span>
                  </div>
                </th>
              </tr>
            </thead>
          </table>
          <div
            ref={tableScrollRef}
            className="max-h-[58px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <table className="w-full border-collapse text-sm !mt-0 table-fixed">
              <colgroup>
                <col style={{ width: 72 }} />
                <col style={{ width: 100 }} />
                <col />
              </colgroup>
              <tbody className="[&>tr:last-child>td]:border-b-0">
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    className={cn(
                      'transition-colors duration-500',
                      tableFlashId === msg.id ? 'bg-brand/15 dark:bg-brand/5' : 'bg-surface-75'
                    )}
                  >
                    <td className="border-b border-r border-default px-3 py-1.5 text-foreground-muted text-xs truncate max-w-0">
                      {msg.id}
                    </td>
                    <td className="border-b border-r border-default px-3 py-1.5 text-foreground text-xs truncate max-w-0">
                      {msg.user}
                    </td>
                    <td className="border-b border-default px-3 py-1.5 text-foreground text-xs truncate max-w-0">
                      {msg.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Connecting dashed lines */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[140px] flex gap-2 z-[1] text-background-surface-300">
        <svg width="2" height="52" fill="none" className="overflow-visible">
          <line
            x1="1"
            y1="0"
            x2="1"
            y2="52"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            style={{ animation: 'rlDashFlow 1s linear infinite' }}
          />
        </svg>
        <svg width="2" height="52" fill="none" className="overflow-visible">
          <line
            x1="1"
            y1="0"
            x2="1"
            y2="52"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            style={{ animation: 'rlDashFlow 1s linear infinite 0.5s' }}
          />
        </svg>
        <style>{`@keyframes rlDashFlow { to { stroke-dashoffset: -8; } }`}</style>
      </div>

      {/* Chat UI */}
      <div className="px-4 pb-4 relative z-[2]">
        <div className="border border-border rounded-lg overflow-hidden bg-surface-200 max-w-[90%]">
          <div
            ref={chatScrollRef}
            className="h-[120px]  overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col gap-2 px-3 py-3"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%)',
            }}
          >
            {messages.map((msg) => {
              const isAlice = msg.user === 'Alice'
              return (
                <div key={msg.id} className={cn('flex', isAlice ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] px-3 py-1.5 rounded-xl text-xs leading-snug transition-colors duration-500',
                      isAlice
                        ? 'bg-brand/15 text-foreground rounded-br-sm'
                        : 'bg-surface-300 text-foreground rounded-bl-sm',
                      chatFlashId === msg.id && 'ring-1 ring-brand/30'
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <SectionContainerWithCn className="space-y-8 md:space-y-24">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
        <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
          Everything you need
          <br />
          <span className="text-foreground">from your database</span>
        </h3>
        <p className="text-foreground-lighter text-sm lg:text-base">
          Every Supabase project is a full Postgres database with realtime functionality,
          fine-grained access controls, and instant APIs — no extra configuration required.
        </p>
      </div>

      {/* 3-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {FEATURES.map((feature) => {
          const Visual = feature.visual
          return (
            <div
              key={feature.title}
              className="flex flex-col bg-surface-75 border border-border rounded-lg overflow-hidden"
            >
              {/* Visual with overlaid title */}
              <div className="relative flex items-center justify-center h-[320px]">
                <Visual />
              </div>
              {/* Content */}
              <div className="px-6 py-5 flex flex-col gap-1">
                <h4 className="text-foreground text-sm font-medium">{feature.description}</h4>
                <p className="text-foreground-lighter text-sm">{feature.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </SectionContainerWithCn>
  )
}
