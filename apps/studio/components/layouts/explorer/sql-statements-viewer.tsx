'use client'

import { useEffect, useState, useRef, useCallback, memo } from 'react'
import { Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from 'ui'
import { Ban, ChevronDown, Loader2, Terminal, Trash2, XCircle } from 'lucide-react'
import dayjs from 'dayjs'
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/atom-one-dark.css'
import { format as sqlFormat } from 'sql-formatter'
import sqlExecutionsState, { useSqlExecutions, type SqlExecution } from 'state/sql-executions'
import clsx from 'clsx'
import { Separator } from 'ui'
import Link from 'next/link'

hljs.registerLanguage('sql', sql)

const formatTime = (ms: number) => {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = ms % 1000

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
}

const highlightSQL = (sql: string) => {
  try {
    const formattedSQL = sqlFormat(sql, {
      language: 'postgresql',
      keywordCase: 'upper',
      linesBetweenQueries: 2,
      indentStyle: 'standard',
      logicalOperatorNewline: 'before',
      expressionWidth: 50,
    })
    const highlightedSQL = hljs.highlight(formattedSQL, { language: 'sql' }).value
    return { __html: highlightedSQL }
  } catch (error) {
    console.error('Error formatting SQL:', error)
    const highlightedSQL = hljs.highlight(sql, { language: 'sql' }).value
    return { __html: highlightedSQL }
  }
}

// Memoize the SQLStatementItem component
const SQLStatementItem = memo(function SQLStatementItem({
  statement,
}: {
  statement: SqlExecution
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const sqlRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sqlRef.current) {
      setIsOverflowing(sqlRef.current.scrollHeight > 300)
    }
  }, [statement.sql])

  return (
    <div className="py-5 flex flex-col gap-5 px-5">
      <div className="flex items-center gap-2">
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_>
            <div className="text-foreground-muted text-left">
              -- {dayjs(statement.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')}
            </div>
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="top" className="flex flex-col gap-1 font-mono">
            <div>
              <span className="text-zinc-400">Local: </span>
              {dayjs(statement.timestamp).format('DD MMM YYYY, HH:mm:ss.SSS')}
            </div>
            <div>
              <span className="text-zinc-400">UTC: </span>
              {dayjs(statement.timestamp).format('DD MMM YYYY, HH:mm:ss.SSS [UTC]')}
            </div>
            <div>
              <span className="text-zinc-400">Timestamp: </span>
              {statement.timestamp}
            </div>
            <div>
              <span className="text-zinc-400">Status: </span>
              {statement.status}
            </div>
          </TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>

        {statement.url && (
          <Link
            href={statement.url}
            className="text-foreground-muted hover:text-foreground transition"
          >
            {statement.url}
          </Link>
        )}
      </div>

      <div className="relative flex flex-col gap-2">
        <div
          ref={sqlRef}
          className={clsx(
            'hljs overflow-x-auto whitespace-pre-wrap !bg-transparent text-xs',
            !isExpanded && 'max-h-[300px] overflow-hidden'
          )}
          dangerouslySetInnerHTML={highlightSQL(statement.sql)}
        />

        {isOverflowing && !isExpanded && (
          <>
            <div className="absolute bottom-0 inset-x-0 h-[150px] bg-gradient-to-t from-black from-20% via-black/50 to-transparent pointer-events-none" />
            <div className="absolute bottom-8 left-0">
              <Button
                type="outline"
                size="tiny"
                onClick={() => setIsExpanded(true)}
                className="rounded-full"
              >
                Show More
              </Button>
            </div>
          </>
        )}

        {isOverflowing && isExpanded && (
          <div>
            <Button
              type="outline"
              size="tiny"
              onClick={() => setIsExpanded(false)}
              className="rounded-full"
            >
              Show Less
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <RunningTimer statement={statement} />
        {statement.status === 'completed' && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-foreground-muted">
              Completed in {formatTime(statement.duration ?? 0)}
            </span>
          </motion.div>
        )}
        {statement.status === 'error' && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-2 w-2 rounded-full bg-destructive-300" />
            <span className="text-destructive">Error</span>
          </motion.div>
        )}
      </div>

      {statement.status === 'error' && statement.error && (
        <div className="text-destructive bg-destructive-100 border border-destructive-300 rounded px-4 py-3 flex flex-col gap-2">
          {statement.error.title && (
            <span className="font-bold text-destructive-600">{statement.error.title}</span>
          )}
          <span className="text-destructive-600 text-xs">
            {statement.error.message || statement.error}
          </span>
        </div>
      )}
    </div>
  )
})

// Add memo to exports
export const SQLStatementsViewer = memo(function SQLStatementsViewer() {
  const { executions } = useSqlExecutions()
  const [showJumpButton, setShowJumpButton] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolledToBottomRef = useRef(true)

  // This useEffect should run whenever executions change
  useEffect(() => {
    if (isScrolledToBottomRef.current && containerRef.current) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      })
    }
  }, [executions]) // Make sure we're watching executions

  const isScrolledToBottom = useCallback(() => {
    if (!containerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    return Math.abs(scrollHeight - clientHeight - scrollTop) < 10
  }, [])

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
    setShowJumpButton(false)
  }, [])

  const handleScroll = useCallback(() => {
    const atBottom = isScrolledToBottom()
    isScrolledToBottomRef.current = atBottom
    setShowJumpButton(!atBottom)
  }, [isScrolledToBottom])

  return (
    <div className="relative w-full h-full flex flex-col dark">
      <div className="flex items-center justify-between h-8 border-b border-border/60 px-5 bg-black shadow-inner text-gray fill-gray">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="lightgray"
            className="size-5"
          >
            <path
              fill-rule="evenodd"
              d="M2.25 6a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V6Zm3.97.97a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 0 1-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 0 1 0-1.06Zm4.28 4.28a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z"
              clip-rule="evenodd"
            />
          </svg>
          <span className="text-xs font-mono text-white">Supabase Console</span>
        </div>
        <button onClick={() => sqlExecutionsState.clearExecutions()}>
          <Ban size={12} />
        </button>
      </div>
      <div
        ref={containerRef}
        className="w-full h-full text-white font-mono text-sm overflow-auto scroll-smooth overflow-anchor-auto py-8"
        onScroll={handleScroll}
      >
        <div className="flex flex-col gap-2 divide-y divide-border/50">
          <AnimatePresence initial={false}>
            {executions.map((execution, index) => (
              <SQLStatementItem key={index} statement={execution} />
            ))}
          </AnimatePresence>
        </div>
      </div>
      {showJumpButton && (
        <Button
          type="default"
          className="absolute left-1/2 bottom-4 -translate-x-1/2 bg-black text-zinc-100 hover:bg-zinc-700 rounded-full px-4 py-2 flex items-center gap-2"
          onClick={scrollToBottom}
          icon={<ChevronDown className="h-4 w-4" />}
        >
          <span>Scroll to bottom</span>
        </Button>
      )}
    </div>
  )
})

function RunningTimer({ statement }: { statement: SqlExecution }) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showTimer, setShowTimer] = useState(false)

  // Memoize the timer logic
  useEffect(() => {
    if (statement.status !== 'running') return

    const startTime = statement.startedAt
    const timerInterval = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 100) // Increased interval from 10ms to 100ms

    const timerTimeout = setTimeout(() => {
      setShowTimer(true)
    }, 200)

    return () => {
      clearInterval(timerInterval)
      clearTimeout(timerTimeout)
    }
  }, [statement.status, statement.startedAt])

  if (statement.status !== 'running') {
    return null
  }

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={false}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
      <span className="text-foreground">
        {showTimer ? `Running for ${formatTime(elapsedTime)}...` : 'Executing...'}
      </span>
    </motion.div>
  )
}
