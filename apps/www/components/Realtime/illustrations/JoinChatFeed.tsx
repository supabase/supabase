'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

import { COLLABORATOR_500_COLORS } from '../Hero/participantColors'
import { DebugSlider } from './DebugSlider'

const MAX_VISIBLE = 6
const MAX_INTERVAL_MS = 1500

const JOIN_USERS = [
  'Jonny',
  'Paul',
  'Ant',
  'Matt',
  'Sarah',
  'Alex',
  'Jordan',
  'Casey',
  'Riley',
  'Morgan',
  'Taylor',
  'Jamie',
  'Quinn',
  'Avery',
  'Blake',
  'Charlie',
  'Drew',
  'Emery',
  'Finley',
  'Hayden',
] as const

const CHAT_MESSAGES = [
  { name: 'Sarah', message: '💚💚💚💚💚💚💚💚' },
  { name: 'Matt', message: 'Hey everyone, this is so cool!' },
  { name: 'Jonny', message: 'ok this is actually insane 🔥' },
  { name: 'Paul', message: 'presence sync goes hard' },
  { name: 'Ant', message: 'anyone else seeing the cursors?' },
  { name: 'Alex', message: 'hiiii 👋' },
  { name: 'Jordan', message: 'wow realtime postgres 🤯' },
  { name: 'Casey', message: 'brb grabbing coffee ☕' },
  { name: 'Riley', message: 'we love supabase' },
  { name: 'Morgan', message: 'this demo is sick' },
  { name: 'Taylor', message: '🎉🎉🎉' },
  { name: 'Jamie', message: 'synced in milliseconds' },
  { name: 'Quinn', message: 'no refresh needed!!' },
  { name: 'Avery', message: 'peak developer experience' },
  { name: 'Blake', message: 'ok who invited everyone lol' },
  { name: 'Charlie', message: 'hello from london 🇬🇧' },
  { name: 'Drew', message: 'lets ship it 🚀' },
  { name: 'Emery', message: 'the latency is crazy good' },
  { name: 'Finley', message: '💜💜💜' },
  { name: 'Hayden', message: 'just joined, what did i miss?' },
] as const

type JoinFeedEntry = {
  id: string
  type: 'join'
  name: string
}

type MessageFeedEntry = {
  id: string
  type: 'message'
  name: string
  message: string
}

type FeedEntry = JoinFeedEntry | MessageFeedEntry

type JoinChatFeedProps = {
  className?: string
  debug?: boolean
  skewY?: number
  rotateX?: number
  rotateY?: number
  rotateZ?: number
  scale?: number
  offsetX?: number
  offsetY?: number
}

function getColorForName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLLABORATOR_500_COLORS[Math.abs(hash) % COLLABORATOR_500_COLORS.length]!
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

function pushEntry(entries: FeedEntry[], entry: FeedEntry) {
  return [...entries, entry].slice(-MAX_VISIBLE)
}

function FeedAvatar({ name }: { name: string }) {
  return (
    <div
      className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
      style={{ backgroundColor: getColorForName(name) }}
    >
      {getInitials(name)}
    </div>
  )
}

function FeedRow({ entry }: { entry: FeedEntry }) {
  if (entry.type === 'join') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-default/60 bg-surface-200/90 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
        <FeedAvatar name={entry.name} />
        <p className="min-w-0 text-xs leading-snug text-foreground-light">
          <span className="font-medium text-foreground">{entry.name}</span> has joined the chat!
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 px-0.5 py-0.5">
      <FeedAvatar name={entry.name} />
      <p className="min-w-0 text-xs leading-snug text-foreground-light">
        <span className="font-medium text-foreground">{entry.name}:</span> {entry.message}
      </p>
    </div>
  )
}

export function JoinChatFeed({
  className,
  debug = false,
  skewY: skewYProp = 0,
  rotateX: rotateXProp = 0,
  rotateY: rotateYProp = 0,
  rotateZ: rotateZProp = 0,
  scale: scaleProp = 1,
  offsetX: offsetXProp = 0,
  offsetY: offsetYProp = 0,
}: JoinChatFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const joinIndexRef = useRef(0)
  const messageIndexRef = useRef(0)
  const sequenceRef = useRef(0)

  const [debugSkewY, setDebugSkewY] = useState(skewYProp)
  const [debugRotateX, setDebugRotateX] = useState(rotateXProp)
  const [debugRotateY, setDebugRotateY] = useState(rotateYProp)
  const [debugRotateZ, setDebugRotateZ] = useState(rotateZProp)
  const [debugScale, setDebugScale] = useState(scaleProp)
  const [debugOffsetX, setDebugOffsetX] = useState(offsetXProp)
  const [debugOffsetY, setDebugOffsetY] = useState(offsetYProp)

  const skewY = debug ? debugSkewY : skewYProp
  const rotateX = debug ? debugRotateX : rotateXProp
  const rotateY = debug ? debugRotateY : rotateYProp
  const rotateZ = debug ? debugRotateZ : rotateZProp
  const scale = debug ? debugScale : scaleProp
  const offsetX = debug ? debugOffsetX : offsetXProp
  const offsetY = debug ? debugOffsetY : offsetYProp

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    let cancelled = false

    const nextEntry = (): FeedEntry => {
      sequenceRef.current += 1
      const id = `feed-${sequenceRef.current}`

      if (Math.random() < 0.45) {
        const { name, message } = CHAT_MESSAGES[messageIndexRef.current % CHAT_MESSAGES.length]!
        messageIndexRef.current += 1
        return { id, type: 'message', name, message }
      }

      const name = JOIN_USERS[joinIndexRef.current % JOIN_USERS.length]!
      joinIndexRef.current += 1
      return { id, type: 'join', name }
    }

    const scheduleNext = (delayMs: number) => {
      timeoutId = setTimeout(() => {
        if (cancelled) return

        setEntries((current) => pushEntry(current, nextEntry()))
        scheduleNext(Math.random() * MAX_INTERVAL_MS)
      }, delayMs)
    }

    sequenceRef.current = 1
    joinIndexRef.current = 1
    setEntries([{ id: 'feed-0', type: 'join', name: JOIN_USERS[0]! }])

    scheduleNext(Math.random() * MAX_INTERVAL_MS)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <>
      <div className="absolute inset-0" style={{ perspective: '1200px' }}>
        <div
          className={cn(
            'absolute bottom-4 left-4 flex w-[min(100%,18rem)] origin-bottom-left flex-col justify-end gap-1.5',
            className
          )}
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale}) skewY(${skewY}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              >
                <FeedRow entry={entry} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {debug ? (
        <div className="pointer-events-auto absolute right-3 top-3 z-20 max-h-[calc(100%-1.5rem)] w-44 overflow-y-auto rounded-md border border-default bg-surface-100/95 p-3 shadow-sm backdrop-blur-sm">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-foreground-lighter">
            Composition debug
          </p>
          <div className="grid gap-3">
            <DebugSlider label="scale" value={debugScale} min={0.5} max={2.5} step={0.05} onChange={setDebugScale} />
            <DebugSlider label="offsetX" value={debugOffsetX} min={-80} max={80} step={1} onChange={setDebugOffsetX} />
            <DebugSlider label="offsetY" value={debugOffsetY} min={-80} max={80} step={1} onChange={setDebugOffsetY} />
            <DebugSlider label="skewY" value={debugSkewY} min={-20} max={20} step={1} onChange={setDebugSkewY} />
            <DebugSlider label="rotateX" value={debugRotateX} min={-45} max={45} step={1} onChange={setDebugRotateX} />
            <DebugSlider label="rotateY" value={debugRotateY} min={-45} max={45} step={1} onChange={setDebugRotateY} />
            <DebugSlider label="rotateZ" value={debugRotateZ} min={-45} max={45} step={1} onChange={setDebugRotateZ} />
          </div>
        </div>
      ) : null}
    </>
  )
}
