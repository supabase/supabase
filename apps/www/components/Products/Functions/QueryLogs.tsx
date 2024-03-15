import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge, IconAlertCircle, IconInfo, cn } from 'ui'
import { useInterval } from 'react-use'

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
    'booted (time: 82ms)',
    'booted (time: 110ms)',
    'booted (time: 65ms)',
    'booted (time: 98ms)',
    'booted (time: 91ms)',
    'booted (time: 97ms)',
  ],
  ERROR: ['warning: Use of deprecated API.'],
}

function getRandomNumber(min: number, max: number) {
  var range = max - min
  var randomNumber = Math.random() * range + min

  return Math.round(randomNumber)
}

const QueryLogs = () => {
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
    const randomStatus = Math.random()
    const s = randomStatus > 0.9 ? STATUS.ERROR : randomStatus > 0.5 ? STATUS.INFO : STATUS.LOG

    const randomMessage = messages[s][getRandomNumber(0, messages[s].length - 1)]

    return {
      timestamp: t,
      id: crypto.randomUUID(),
      status: s,
      message: randomMessage,
    }
  }

  useInterval(() => {
    const skip = Math.random() > 0.4
    if (skip) return

    const newLog = createLog()
    setActiveLogs([newLog, ...activeLogs])
  }, 1500)

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
      <motion.ul layout className="relative z-10 w-full h-auto flex flex-col px-4 overflow-y-auto">
        <AnimatePresence>
          {activeLogs.map((log, i) => (
            <motion.li
              layout
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0, transition: { delay: 0.15 } }}
              className="px-2 py-2 pointer-events-auto border-b hover:bg-selection/20 first:border-t w-full font-mono text-xs flex gap-4 lg:gap-5 items-center"
            >
              <span className="shrink-0">{dayjs(log.timestamp).format('D MMM HH:mm:ss')}</span>
              <span
                className={cn(
                  'w-[50px] flex items-center gap-1',
                  log.status === 'ERROR' ? '!text-red-900' : '!text-blue-900'
                )}
              >
                <span>
                  {log.status === 'LOG' ? (
                    <IconInfo size={14} strokeWidth={2} />
                  ) : (
                    <IconAlertCircle size={14} strokeWidth={2} />
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
