'use client'

import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { motion } from 'framer-motion'
import { Key } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

const FEATURES = [
  {
    title: 'Database changes',
    description:
      'Listen to inserts, updates, and deletes in your Postgres database and react instantly.',
    visual: DatabaseChangesSkeleton,
  },
  {
    title: 'Presence',
    description:
      'Store and synchronize online user state consistently across all connected clients.',
    visual: PresenceSkeleton,
  },
  {
    title: 'Broadcast',
    description: 'Send any data to any client subscribed to the same channel with low latency.',
    visual: BroadcastSkeleton,
  },
]

type ChatMsg = { id: number; user: string; text: string }

const MAX_MESSAGES = 20

const initialMessages: ChatMsg[] = [
  { id: 1, user: 'Alice', text: 'Hey, is the deploy ready?' },
  { id: 2, user: 'Bob', text: 'Almost — running final tests now.' },
  { id: 3, user: 'Alice', text: 'Nice, let me know when it\u2019s live.' },
]

const incomingMessages: ChatMsg[] = [
  { id: 4, user: 'Bob', text: 'All green. Deploying now  \u{1F680}' },
  { id: 5, user: 'Alice', text: 'Awesome, checking it out.' },
  { id: 6, user: 'Bob', text: 'Latency dropped to 42ms!' },
  { id: 7, user: 'Alice', text: 'That\u2019s a big improvement.' },
  { id: 8, user: 'Bob', text: 'Yeah, the new index helped.' },
  { id: 9, user: 'Alice', text: 'Should we update the docs?' },
  { id: 10, user: 'Bob', text: 'Already on it.' },
]

function DatabaseChangesSkeleton() {
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

    const innerTimers: ReturnType<typeof setTimeout>[] = []

    const timer = setInterval(() => {
      const msg = incomingMessages[nextMsgIdx.current % incomingMessages.length]
      const newMsg = { ...msg, id: Date.now() + nextMsgIdx.current }
      nextMsgIdx.current++

      setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), newMsg])
      setTableFlashId(newMsg.id)

      requestAnimationFrame(() => {
        tableScrollRef.current?.scrollTo({
          top: tableScrollRef.current.scrollHeight,
          behavior: 'smooth',
        })
      })

      const chatTimer = setTimeout(() => {
        setChatFlashId(newMsg.id)
        requestAnimationFrame(() => {
          chatScrollRef.current?.scrollTo({
            top: chatScrollRef.current.scrollHeight,
            behavior: 'smooth',
          })
        })
        const clearTimer = setTimeout(() => {
          setTableFlashId(null)
          setChatFlashId(null)
        }, 600)
        innerTimers.push(clearTimer)
      }, 200)
      innerTimers.push(chatTimer)
    }, 3000)

    return () => {
      clearInterval(timer)
      innerTimers.forEach(clearTimeout)
    }
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
              <tbody className="[&>tr:last-child>td]:border-b-0 [&>tr:first-child>td]:border-t-0">
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
            className="h-[120px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col gap-2 px-3 py-3"
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

const PRESENCE_USERS = [
  { name: 'Alan', initials: 'AD', color: '#3ECF8E' },
  { name: 'Jonny', initials: 'JW', color: '#6c63ff' },
  { name: 'Copple', initials: 'CP', color: '#F06A50' },
  { name: 'Terry', initials: 'TP', color: '#f1a10d' },
]

// Subtle looping paths — small movements around a home position
const CURSOR_PATHS: { x: number; y: number }[][] = [
  [
    { x: 24, y: 38 },
    { x: 28, y: 42 },
    { x: 22, y: 44 },
    { x: 26, y: 36 },
  ],
  [
    { x: 58, y: 30 },
    { x: 54, y: 34 },
    { x: 60, y: 36 },
    { x: 56, y: 28 },
  ],
  [
    { x: 36, y: 64 },
    { x: 40, y: 68 },
    { x: 34, y: 70 },
    { x: 38, y: 62 },
  ],
  [
    { x: 68, y: 56 },
    { x: 64, y: 60 },
    { x: 70, y: 62 },
    { x: 66, y: 54 },
  ],
]

// Different loop durations so cursors drift out of phase
const CURSOR_DURATIONS = [6, 7.5, 8.5, 7]

function PresenceCursor({
  user,
  path,
  duration,
}: {
  user: (typeof PRESENCE_USERS)[number]
  path: { x: number; y: number }[]
  duration: number
}) {
  // Build looping keyframes — close the loop by appending the first point
  const xFrames = [...path.map((p) => `${p.x}%`), `${path[0].x}%`]
  const yFrames = [...path.map((p) => `${p.y}%`), `${path[0].y}%`]

  return (
    <motion.div
      className="absolute"
      initial={{ left: `${path[0].x}%`, top: `${path[0].y}%` }}
      animate={{ left: xFrames, top: yFrames }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="drop-shadow-md"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
        aria-hidden
      >
        <path
          d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
          fill={user.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="ml-3 -mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-medium text-white shadow-sm"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </span>
    </motion.div>
  )
}

const YOU_COLOR = '#e563f5'

function PresenceSkeleton() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ cursor: hovered ? 'none' : undefined }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Stacked avatars — top right */}
      <div className="absolute right-4 top-4 z-10 flex -space-x-2">
        {PRESENCE_USERS.map((user) => (
          <div
            key={user.name}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-200 text-[9px] font-medium text-foreground"
            style={{
              boxShadow: `0 0 0 2px hsl(var(--background-surface-75)), 0 0 0 4px ${user.color}`,
            }}
          >
            {user.initials}
          </div>
        ))}
        {/* Your avatar — appears on hover */}
        <motion.div
          className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-200 text-[9px] font-medium text-foreground"
          style={{
            boxShadow: `0 0 0 2px hsl(var(--background-surface-75)), 0 0 0 4px ${YOU_COLOR}`,
          }}
          initial={{ opacity: 0, scale: 0.5, width: 0, marginLeft: 0 }}
          animate={
            hovered
              ? { opacity: 1, scale: 1, width: 28, marginLeft: -8 }
              : { opacity: 0, scale: 0.5, width: 0, marginLeft: 0 }
          }
          transition={{ type: 'spring', duration: 0.47, bounce: 0 }}
        >
          You
        </motion.div>
      </div>

      {/* Animated cursors */}
      {PRESENCE_USERS.map((user, i) => (
        <PresenceCursor
          key={user.name}
          user={user}
          path={CURSOR_PATHS[i]}
          duration={CURSOR_DURATIONS[i]}
        />
      ))}

      {/* Your cursor — follows mouse on hover */}
      {hovered && (
        <div className="pointer-events-none absolute z-20" style={{ left: mouse.x, top: mouse.y }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="drop-shadow-md"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
            aria-hidden
          >
            <path
              d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
              fill={YOU_COLOR}
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="ml-3 -mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-medium text-white shadow-sm"
            style={{ backgroundColor: YOU_COLOR }}
          >
            You
          </span>
        </div>
      )}
    </div>
  )
}

const BROADCAST_PATHS = [
  { d: 'M180,58 C180,135 80,175 80,268', delay: 0 },
  { d: 'M180,58 C180,135 140,175 140,268', delay: 0.15 },
  { d: 'M180,58 C180,135 220,175 220,268', delay: 0.3 },
  { d: 'M180,58 C180,135 280,175 280,268', delay: 0.45 },
]

const BROADCAST_CLIENTS = [
  {
    // User icon
    icon: (
      <>
        <path
          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
  {
    // Image icon
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    // Layers icon
    icon: (
      <>
        <path
          d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="m2 12 8.58 3.91a2 2 0 0 0 1.66 0L21 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m2 17 8.58 3.91a2 2 0 0 0 1.66 0L21 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    // Database icon
    icon: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M19 12c0 1.66-3.13 3-7 3s-7-1.34-7-3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 5v14c0 1.66 3.13 3 7 3s7-1.34 7-3V5" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
]

const PULSE_DURATION = 3000
// Time (ms) for pulse leading edge to reach the node
const PULSE_ARRIVAL = 350

function BroadcastSkeleton() {
  const [flashSet, setFlashSet] = useState<Set<number>>(new Set())

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    function scheduleFlashes() {
      BROADCAST_PATHS.forEach((line, i) => {
        const arrivalOffset = line.delay * 1000 + PULSE_ARRIVAL
        const t = setTimeout(() => {
          setFlashSet((prev) => new Set(prev).add(i))
          const clearT = setTimeout(() => {
            setFlashSet((prev) => {
              const next = new Set(prev)
              next.delete(i)
              return next
            })
          }, 500)
          timers.push(clearT)
        }, arrivalOffset)
        timers.push(t)
      })
    }

    scheduleFlashes()
    const interval = setInterval(scheduleFlashes, PULSE_DURATION)

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="relative h-full w-full">
      {/* Source node — top center */}
      <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-100 px-3 py-2 shadow-xs dark:shadow-sm">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className="text-brand"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m22 8-6 4 6 4V8Z" stroke="currentColor" strokeWidth="1.5" />
            <rect
              x="2"
              y="6"
              width="14"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <span className="text-xs font-medium text-foreground">channel:room-1</span>
        </div>
      </div>

      {/* SVG curves */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 360 320"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        {BROADCAST_PATHS.map((line, i) => (
          <g key={i}>
            <path
              d={line.d}
              stroke="hsl(var(--foreground-muted))"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.15"
            />
            <path
              d={line.d}
              stroke="#3ECF8E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="40 560"
              style={{
                animation: `broadcastPulse 3s ${line.delay}s linear infinite`,
              }}
            />
          </g>
        ))}
      </svg>

      {/* Destination nodes — positioned to match SVG path endpoints */}
      {BROADCAST_CLIENTS.map((client, i) => {
        const xPercent = [23.2, 39.5, 61, 77][i]
        const isFlashing = flashSet.has(i)

        return (
          <div
            key={i}
            className={cn(
              'absolute bottom-6 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-xl border bg-surface-100 shadow-xs dark:shadow-sm transition-all duration-300',
              isFlashing ? 'border-brand text-brand' : 'border-border text-foreground-muted'
            )}
            style={{ left: `${xPercent}%` }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              {client.icon}
            </svg>
          </div>
        )
      })}

      <style>{`
        @keyframes broadcastPulse {
          from { stroke-dashoffset: 600; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <SectionContainerWithCn spacing="sections">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
        <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
          Three ways
          <br />
          <span className="text-foreground">to go realtime</span>
        </h3>
        <p className="text-foreground-lighter text-sm lg:text-base">
          Database changes, presence tracking, and broadcast messaging — everything you need to
          build collaborative, real-time applications.
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
              <div className="relative flex items-center justify-center h-[320px]">
                <Visual />
              </div>
              <div className="px-6 py-5 flex flex-col gap-1">
                <h4 className="text-foreground text-sm font-medium">{feature.title}</h4>
                <p className="text-foreground-lighter text-sm">{feature.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </SectionContainerWithCn>
  )
}
