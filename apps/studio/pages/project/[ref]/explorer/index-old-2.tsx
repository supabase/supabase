import { EmptyStatePanel } from 'components/layouts/explorer/empty-state-panel'
import { ExplorerLayout } from 'components/layouts/explorer/layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { Sparkles, Box, X, Move, BaggageClaim, BookOpen } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import { Button, Separator, Skeleton } from 'ui'
import { motion, Variants, LayoutGroup, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { AssistantChatForm } from 'ui-patterns/AssistantChat'
import { usePostgresInUse } from 'data/database/postgres-in-use-query'

interface AssistantChatDemoProps {
  value: string
  setValueState: (value: string) => void
  onSubmit: () => void
}

function AssistantChatDemo({ value, setValueState, onSubmit }: AssistantChatDemoProps) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [value])

  return (
    <AssistantChatForm
      textAreaRef={inputRef}
      placeholder="Ask me anything..."
      icon={<Box strokeWidth={1.5} size={24} className="text-foreground-muted" />}
      value={value}
      loading={loading}
      disabled={loading}
      onValueChange={(e) => setValueState(e.target.value)}
      onSubmit={async (event) => {
        event.preventDefault()
        setLoading(true)
        setTimeout(() => {
          setLoading(false)
          onSubmit()
        }, 1500)
      }}
    />
  )
}

const ExplorerPage: NextPageWithLayout = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [input, setInput] = useState('')
  const [showRightPanel, setShowRightPanel] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { isInUse: isPostgresInUse, isLoading: isLoadingCheckingPostgres } = usePostgresInUse()

  // Panels to show when Postgres is not in use yet
  const EMPTY_POSTGRES_PANELS = [
    {
      title: `Create your first table`,
      description: `Create tables in your Postgres database to store and organize your data.`,
      buttonText: 'Create Table',
      aiButtonText: 'Ask AI',
    },
    {
      title: `Write your first SQL query`,
      description: `Write SQL to execute on your Postgres database.`,
      buttonText: 'Create your first Query',
      aiButtonText: 'Ask AI',
    },
  ]

  // Panels to show when Postgres is already in use
  const POSTGRES_IN_USE_PANELS = [
    {
      title: 'Query your data',
      description: 'Write and execute SQL queries to explore and analyze your Postgres database.',
      buttonText: 'Create query',
      aiButtonText: 'Ask AI',
    },
    {
      title: 'Create table',
      description: 'Add new tables to your database schema.',
      buttonText: 'Open Table Editor',
      aiButtonText: 'Ask AI',
    },
  ]

  const panels = isPostgresInUse ? POSTGRES_IN_USE_PANELS : EMPTY_POSTGRES_PANELS

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 600,
        damping: 50,
        staggerChildren: 0.08,
        delayChildren: 0.03,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96, y: 15 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 600,
        damping: 50,
        staggerChildren: 0.08,
        delayChildren: 0.03,
      },
    },
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <LayoutGroup>
      <motion.div
        className="flex h-full w-full"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <motion.div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto px-5 gap-12">
          <motion.div className="grid grid-cols-2 gap-16 w-full" variants={itemVariants}>
            {isLoadingCheckingPostgres ? (
              <>
                {[...Array(2)].map((_, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="w-full flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full rounded" />
                      <Skeleton className="h-3 w-3/4 rounded" />
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Skeleton className="h-8 w-24 rounded" />
                      <Skeleton className="h-8 w-32 rounded" />
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              panels.map((data, index) => (
                <motion.div
                  key={data.title}
                  variants={itemVariants}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <EmptyStatePanel {...data} />
                </motion.div>
              ))
            )}
          </motion.div>
          {/* Migration section - only show if Postgres is not in use */}
          {isLoadingCheckingPostgres ? (
            <motion.div className="w-full" variants={itemVariants}>
              <Skeleton className="w-full h-[160px] rounded-lg" />
            </motion.div>
          ) : (
            !isPostgresInUse && (
              <motion.div
                className="w-full rounded-lg overflow-hidden relative border border-muted"
                variants={itemVariants}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-background-surface-200 via-background-surface-200 to-transparent"></div>
                <div className="relative z-10 px-5 py-4 h-full flex gap-5 items-center justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-4">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-300 border">
                        <BaggageClaim
                          size={14}
                          className="text-foreground-light"
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h2 className="text-base text-foreground">
                          Migrate your Database to Postgres
                        </h2>
                        <p className="text-xs text-foreground-light max-w-md">
                          Already have a database? Migrate any database to Supabase to access
                          backups, RESTful auto APIs, Authentication and more.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button type="default" className="rounded-full" iconRight={<BookOpen />}>
                    Migrate to Postgres
                  </Button>
                </div>
              </motion.div>
            )
          )}
          {!showRightPanel && <Separator />}
          <AnimatePresence>
            {!showRightPanel && (
              <motion.div
                variants={itemVariants}
                className="w-full"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div className="flex flex-col gap-3">
                  <motion.p
                    className="text-sm text-foreground-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showRightPanel ? 0 : 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Try these example prompts:
                  </motion.p>
                  {isLoading ? (
                    <>
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="h-6 bg-foreground/10 rounded animate-pulse"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 * i }}
                        />
                      ))}
                    </>
                  ) : (
                    [
                      'Create a table to store user profiles with basic information',
                      'Help me write a query to find the most active users in the last 30 days',
                      'Show me how to implement row level security for a multi-tenant application',
                      'Generate a function to calculate the distance between two geographic points',
                    ].map((prompt, i) => (
                      <motion.div
                        key={prompt}
                        className="text-sm text-foreground-light hover:text-foreground cursor-pointer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                          opacity: showRightPanel ? 0 : 1,
                          x: showRightPanel ? -20 : 0,
                        }}
                        transition={{
                          delay: showRightPanel ? 0 : 0.4 + i * 0.1,
                          duration: 0.2,
                        }}
                        onClick={() => {
                          setInput(prompt)
                          inputRef.current?.focus()
                        }}
                      >
                        "{prompt}"
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            variants={itemVariants}
            className="w-full"
            layout
            layoutId="chat-input"
            key="chat-input"
          >
            <AssistantChatDemo
              value={input}
              setValueState={setInput}
              onSubmit={() => setShowRightPanel(true)}
            />
          </motion.div>
        </motion.div>

        {showRightPanel && (
          <motion.div
            className="w-[400px] border-l border-muted h-full bg-surface-100 flex flex-col"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
          >
            <div className="flex justify-between items-center p-4 border-b border-muted">
              <h3 className="text-sm font-medium">AI Assistant</h3>
              <button
                onClick={() => {
                  setShowRightPanel(false)
                  setInput('')
                }}
                className="p-1 hover:bg-surface-200 rounded-md"
              >
                <X size={16} className="text-foreground-light" />
              </button>
            </div>

            <div className="flex-1">{/* Chat content will go here */}</div>

            <motion.div
              layout
              layoutId="chat-input"
              key="chat-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 border-t border-muted"
            >
              <AssistantChatDemo value={input} setValueState={setInput} onSubmit={() => {}} />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </LayoutGroup>
  )
}

ExplorerPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <ExplorerLayout>{page}</ExplorerLayout>
  </ProjectContextFromParamsProvider>
)

export default ExplorerPage
