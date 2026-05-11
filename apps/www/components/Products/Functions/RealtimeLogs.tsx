import dayjs from 'dayjs'
import { AnimatePresence, motion } from 'framer-motion'
import { FC, useEffect, useState } from 'react'
import { useInterval } from 'react-use'
import { Badge, cn } from 'ui'

interface Props {
  isActive?: boolean
  isInView?: boolean
  className?: string
}

const RealtimeLogs: FC<Props> = ({ isActive, isInView, className }) => {
  const [mounted, setMounted] = useState(false)

  const isPlaying = isActive && isInView
  const INTERVAL = 550 // in milliseconds

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
    const t = new Date()
    t.setSeconds(t.getSeconds() - (offset ?? 0))

    const rand = Math.random()
    const status = rand > 0.92 ? 500 : rand > 0.85 ? 404 : rand > 0.8 ? 301 : rand > 0.75 ? 201 : 200

    return {
      status,
      method: Math.random() > 0.5 ? 'GET' : 'POST',
      id: crypto.randomUUID(),
      timestamp: t,
    }
  }

  useEffect(() => {
    if (isPlaying) {
      const newLog = createLog()
      setActiveLogs((prev) => [newLog, ...prev])
    }
  }, [isPlaying])

  useInterval(
    () => {
      const skip = Math.random() > 0.6
      if (skip) return

      const newLog = createLog()
      setActiveLogs((prev) => [newLog, ...prev])
    },
    isPlaying ? INTERVAL : null
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <div
        className={cn(
          'visual-overlay absolute z-20 pointer-events-none inset-0 bottom-auto h-32 bg-[linear-gradient(to_bottom,hsl(var(--background-surface-75))_0%,transparent_100%)] transition-opacity duration-300',
          isPlaying ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        className={cn(
          'visual-overlay absolute z-20 pointer-events-none inset-0 top-auto h-32 bg-[linear-gradient(to_top,hsl(var(--background-surface-75))_0%,transparent_100%)] transition-opacity duration-300',
          isPlaying ? 'opacity-100' : 'opacity-0'
        )}
      />
      <motion.ul
        layout
        transition={{
          delay: -0.22,
          duration: 0.1,
          staggerChildren: 0.2,
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
              className="h-9 px-4 md:px-6 pointer-events-auto border-b hover:bg-selection/20 w-full font-mono text-xs flex gap-4 items-center"
            >
              <span className="shrink-0">{dayjs(log.timestamp).format('D MMM HH:mm:ss')}</span>
              <span className="shrink-0">
                <Badge
                  variant={log.status >= 500 ? 'destructive' : log.status >= 400 ? 'warning' : log.status >= 300 ? 'default' : 'default'}
                  className={log.status >= 300 && log.status < 400 ? 'bg-blue-200/10 text-blue-900 border-blue-500' : undefined}
                >{log.status}</Badge>
              </span>
              <span className="w-12 shrink-0">{log.method}</span>
              <span className="truncate">{log.id}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  )
}

export default RealtimeLogs
