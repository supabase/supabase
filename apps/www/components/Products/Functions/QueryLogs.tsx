import dayjs from 'dayjs'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useInterval } from 'react-use'
import { cn } from 'ui'

enum STATUS {
  LOG = 'LOG',
  INFO = 'INFO',
  ERROR = 'ERROR',
}

const messages = {
  LOG: [
    '{ query: "sign in" }',
    '{ query: "cors" }',
    '{ query: "context" }',
    '{ query: "auth" }',
    'Listening on http://localhost:9999/',
    'Function up and running',
  ],
  INFO: [
    'shutdown (reason: wall clock time limit reached)',
    'booted (time: 62ms)',
    'booted (time: 65ms)',
    'booted (time: 68ms)',
    'booted (time: 69ms)',
    'booted (time: 71ms)',
    'booted (time: 78ms)',
    'booted (time: 79ms)',
    'booted (time: 82ms)',
    'booted (time: 84ms)',
    'booted (time: 88ms)',
    'booted (time: 91ms)',
    'booted (time: 93ms)',
    'booted (time: 97ms)',
    'booted (time: 98ms)',
    'booted (time: 99ms)',
    'booted (time: 102ms)',
    'booted (time: 110ms)',
  ],
  ERROR: ['warning: Use of deprecated API.'],
}

function getRandomNumber(min: number, max: number) {
  var range = max - min
  var randomNumber = Math.random() * range + min

  return Math.round(randomNumber)
}

const QueryLogs = ({ isActive, isInView }: { isActive?: boolean; isInView?: boolean }) => {
  const [mounted, setMounted] = useState(false)

  const isPlaying = isActive && isInView
  const INTERVAL = 550 // in milliseconds
  const MAX_LOGS = 120

  const logs = [
    createLog(),
    createLog(2000),
    createLog(3000),
    createLog(4000),
    createLog(5000),
    createLog(6000),
    createLog(7000),
    createLog(8000),
    createLog(9000),
    createLog(10000),
  ]

  const [activeLogs, setActiveLogs] = useState(logs)

  function createLog(offset?: number) {
    const t = new Date(Date.now() - (offset ?? 0))
    const randomStatus = Math.random()
    const s = randomStatus > 0.92 ? STATUS.ERROR : randomStatus > 0.5 ? STATUS.INFO : STATUS.LOG

    const randomMessage = messages[s][getRandomNumber(0, messages[s].length - 1)]

    return {
      timestamp: t,
      id: crypto.randomUUID(),
      status: s,
      message: randomMessage,
    }
  }

  useEffect(() => {
    if (isPlaying) {
      const newLog = createLog()
      setActiveLogs((prev) => [newLog, ...prev].slice(0, MAX_LOGS))
    }
  }, [isPlaying])

  useInterval(
    () => {
      const skip = Math.random() > 0.6
      if (skip) return

      const newLog = createLog()
      setActiveLogs((prev) => [newLog, ...prev].slice(0, MAX_LOGS))
    },
    isPlaying ? INTERVAL : null
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className={cn(
          'absolute z-20 pointer-events-none inset-0 bottom-auto h-32 transition-opacity duration-300',
          isPlaying ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background:
            'linear-gradient(to bottom, hsl(var(--background-surface-75)) 0%, transparent 100%)',
        }}
      />
      <div
        className={cn(
          'absolute z-20 pointer-events-none inset-0 top-auto h-32 transition-opacity duration-300',
          isPlaying ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background:
            'linear-gradient(to top, hsl(var(--background-surface-75)) 0%, transparent 100%)',
        }}
      />
      <motion.ul
        layout
        transition={{
          delay: -0.22,
          duration: 0.1,
          staggerChildren: 0.1,
        }}
        className="relative z-10 w-full h-auto flex flex-col overflow-y-auto"
      >
        <AnimatePresence>
          {activeLogs.map((log, i) => (
            <motion.li
              layout
              key={log.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: 0.2 + i * 0.03, duration: 0.15 },
              }}
              className="h-9 px-4 md:px-6 pointer-events-auto border-b hover:bg-selection/20 w-full font-mono text-xs flex gap-4 lg:gap-5 items-center"
            >
              <span className="shrink-0">{dayjs(log.timestamp).format('D MMM HH:mm:ss')}</span>
              <span
                className={cn(
                  'w-[50px] flex items-center gap-1',
                  log.status === 'ERROR'
                    ? 'text-destructive'
                    : log.status === 'INFO'
                      ? 'text-foreground-muted'
                      : 'text-blue-900'
                )}
              >
                <span>
                  {log.status === 'LOG' ? (
                    <Info size={14} strokeWidth={2} />
                  ) : (
                    <AlertCircle size={14} strokeWidth={2} />
                  )}
                </span>
                <span>{log.status}</span>
              </span>
              <span className="truncate">{log.message}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  )
}

export default QueryLogs
