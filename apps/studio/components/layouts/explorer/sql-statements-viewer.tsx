'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'
import { Button } from 'ui'
import { ChevronDown, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/atom-one-dark.css'
import { format as sqlFormat } from 'sql-formatter'

hljs.registerLanguage('sql', sql)

interface SQLStatement {
  id: number
  timestamp: number
  sql: string
  status: 'running' | 'completed' | 'error'
  startedAt: number
  completedAt?: number
  duration?: number
  error?: {
    title: string
    message: string
  }
}

const sampleStatements = [
  {
    id: 1,
    sql: `WITH RECURSIVE subordinates AS (SELECT employee_id, manager_id, full_name FROM employees WHERE employee_id = 2 UNION SELECT e.employee_id, e.manager_id, e.full_name FROM employees e INNER JOIN subordinates s ON s.employee_id = e.manager_id) SELECT * FROM subordinates;`,
  },
  {
    id: 2,
    sql: `SELECT DATE_TRUNC('month', order_date) AS month, product_category, SUM(total_amount) AS total_sales, COUNT(DISTINCT customer_id) AS unique_customers, AVG(total_amount) AS avg_order_value FROM orders JOIN order_items USING (order_id) JOIN products USING (product_id) WHERE order_date >= NOW() - INTERVAL '1 year' GROUP BY 1, 2 HAVING SUM(total_amount) > 10000 ORDER BY total_sales DESC LIMIT 10;`,
  },
  {
    id: 3,
    sql: `CREATE OR REPLACE FUNCTION update_stock() RETURNS TRIGGER AS $$ BEGIN UPDATE products SET stock_quantity = stock_quantity - NEW.quantity WHERE product_id = NEW.product_id; IF (SELECT stock_quantity FROM products WHERE product_id = NEW.product_id) < 0 THEN RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql; CREATE TRIGGER check_stock BEFORE INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION update_stock();`,
  },
  {
    id: 4,
    sql: `SELECT u.user_id, u.username, COUNT(DISTINCT p.post_id) AS total_posts, COUNT(DISTINCT c.comment_id) AS total_comments, COALESCE(SUM(l.like_count), 0) AS total_likes_received FROM users u LEFT JOIN posts p ON u.user_id = p.user_id LEFT JOIN comments c ON u.user_id = c.user_id LEFT JOIN (SELECT post_id, COUNT(*) AS like_count FROM likes GROUP BY post_id) l ON p.post_id = l.post_id WHERE u.created_at >= NOW() - INTERVAL '30 days' GROUP BY u.user_id, u.username HAVING COUNT(DISTINCT p.post_id) > 0 OR COUNT(DISTINCT c.comment_id) > 0 ORDER BY total_likes_received DESC, total_posts DESC, total_comments DESC LIMIT 100;`,
  },
]

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

function SQLStatementItem({ statement }: { statement: SQLStatement }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 1,
      }}
      className="mb-8"
    >
      <Tooltip_Shadcn_>
        <TooltipTrigger_Shadcn_ asChild>
          <div className="text-green-400 cursor-help mb-2">
            -- {dayjs(statement.timestamp).format('YYYY-MM-DD HH:mm:ss.SSSS')}
          </div>
        </TooltipTrigger_Shadcn_>
        <TooltipContent_Shadcn_ side="right" className="flex flex-col gap-1 font-mono">
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

      <motion.div
        className="mt-1 relative overflow-hidden rounded-md bg-zinc-800"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div
          className="hljs p-4 overflow-x-auto whitespace-pre-wrap relative z-0"
          dangerouslySetInnerHTML={highlightSQL(statement.sql)}
        />
        <div className="mt-2 p-4 relative flex items-center gap-4 bg-zinc-900 rounded-b-md">
          <div className="flex-1 flex items-center gap-2">
            <RunningTimer statement={statement} />
            <motion.div
              className="absolute flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={
                statement.status === 'completed' ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }
              }
              transition={{ duration: 0.2 }}
            >
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-green-500">Completed</span>
            </motion.div>
            <motion.div
              className="absolute flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={statement.status === 'error' ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-red-500">Error</span>
            </motion.div>
          </div>
          {statement.status !== 'running' && statement.duration && (
            <span className="text-xs text-zinc-400 flex-shrink-0">
              Completed in {formatTime(statement.duration)}
            </span>
          )}
        </div>
        {statement.status === 'error' && statement.error && (
          <div className="mt-2 p-4 text-red-400 bg-red-400/10 rounded-md">
            <div className="font-bold">{statement.error.title}</div>
            <div>{statement.error.message}</div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export function SQLStatementsViewer() {
  const [statements, setStatements] = useState<SQLStatement[]>([])
  const [showJumpButton, setShowJumpButton] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolledToBottomRef = useRef(true)

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

  const simulateQueryExecution = useCallback((statement: SQLStatement) => {
    const executionTime = Math.random() * 5000 + 500
    setTimeout(() => {
      setStatements((prev) =>
        prev.map((s) => {
          if (s.id === statement.id) {
            const isError = Math.random() < 0.2
            if (isError) {
              return {
                ...s,
                status: 'error',
                completedAt: Date.now(),
                duration: Date.now() - s.startedAt,
                error: {
                  title: 'Query Execution Failed',
                  message: 'An unexpected error occurred while executing the query.',
                },
              }
            } else {
              return {
                ...s,
                status: 'completed',
                completedAt: Date.now(),
                duration: Date.now() - s.startedAt,
              }
            }
          }
          return s
        })
      )
    }, executionTime)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const newStatement = {
        id: Date.now(),
        timestamp: Date.now(),
        sql: sampleStatements[Math.floor(Math.random() * sampleStatements.length)].sql,
        status: 'running',
        startedAt: Date.now(),
      }
      setStatements((prev) => [...prev, newStatement].slice(-100))
      simulateQueryExecution(newStatement)
      if (isScrolledToBottomRef.current) {
        scrollToBottom()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [simulateQueryExecution, scrollToBottom])

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full text-white font-mono text-sm p-4 overflow-auto"
        onScroll={handleScroll}
      >
        <AnimatePresence initial={false}>
          {statements.map((statement, index) => (
            <SQLStatementItem key={statement.id} statement={statement} />
          ))}
        </AnimatePresence>
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
}

function RunningTimer({ statement }: { statement: SQLStatement }) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showTimer, setShowTimer] = useState(false)

  useEffect(() => {
    if (statement.status === 'running') {
      const timerInterval = setInterval(() => {
        setElapsedTime(Date.now() - statement.startedAt)
      }, 10)

      const timerTimeout = setTimeout(() => {
        setShowTimer(true)
      }, 200)

      return () => {
        clearInterval(timerInterval)
        clearTimeout(timerTimeout)
      }
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
