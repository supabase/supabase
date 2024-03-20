import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from 'ui'
import { useInterval } from 'react-use'

const RealtimeLogs = () => {
  const [mounted, setMounted] = useState(false)

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

    return {
      status: Math.random() > 0.995 ? 500 : 200,
      method: Math.random() > 0.5 ? 'GET' : 'POST',
      id: crypto.randomUUID(),
      timestamp: t,
    }
  }

  useInterval(() => {
    const skip = Math.random() > 0.4
    if (skip) return

    const newLog = createLog()
    setActiveLogs([newLog, ...activeLogs])
  }, 1000)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 bottom-8 overflow-hidden">
      <div
        className="absolute z-20 pointer-events-none inset-0 top-auto h-32"
        style={{
          background:
            'linear-gradient(to top, hsl(var(--background-surface-100)) 0%, transparent 100%)',
        }}
      />
      <motion.ul
        transition={{
          staggerChildren: 0.5,
        }}
        layout
        className="relative z-10 w-full h-auto flex flex-col px-4 overflow-y-auto"
      >
        <AnimatePresence>
          {activeLogs.map((log, i) => (
            <motion.li
              layout
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: { delay: i * 0.03, duration: 0.2 },
              }}
              className="py-2 md:px-4 pointer-events-auto border-b hover:bg-selection/20 first:border-t w-full font-mono text-xs flex gap-4 items-center"
            >
              <span className="shrink-0">{dayjs(log.timestamp).format('D MMM HH:mm:ss')}</span>
              <span className="">
                <Badge color={log.status === 200 ? 'slate' : 'amber'} className="rounded">
                  {log.status}
                </Badge>
              </span>
              <span className="w-10 truncate">{log.method}</span>
              <span className="truncate">{log.id}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  )
}

export default RealtimeLogs
