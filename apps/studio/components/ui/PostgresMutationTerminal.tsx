'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import type { TerminalRow, usePostgresMutationTerminal } from 'hooks/ui/usePostgresMutationTerminal'
import { ChevronRight, X } from 'lucide-react'
import { cn } from 'ui'
interface TerminalProps {
  steps: TerminalRow[]
  className?: string
  hook: ReturnType<typeof usePostgresMutationTerminal>
}

function PostgresMutationTerminal({ hook, className }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [hook.steps])

  return (
    <AnimatePresence>
      {hook.isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'relative w-full overflow-hidden bg-black font-mono text-xs text-white border-t border-muted py-2 flex flex-col gap-2',
            className
          )}
        >
          {/* <div className="flex items-center px-3 font-mono uppercase">
            {hook.isRunning ? (
              <>
                <AsciiSpinner isRunning={hook.isRunning} />
                <span className="ml-2">
                  QUERY {hook.steps.length} OF {hook.steps.length}
                </span>
              </>
            ) : (
              <span>
                QUERY {hook.steps.length} OF {hook.steps.length}
              </span>
            )}
          </div> */}
          <button
            onClick={hook.closeTerminal}
            className="text-foreground-muted hover:text-foreground absolute right-3 top-2"
          >
            <X size={16} />
          </button>
          {/* <Separator className="bg-border-muted" /> */}
          <div ref={terminalRef} className="flex gap-1 h-40 overflow-y-auto flex-col-reverse py-2">
            <div className="w-full">
              {hook.steps.map((step) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <div
                    className={`flex items-start gap-2 py-1 px-2 w-full ${
                      step.status === 'success'
                        ? 'bg-brand-300'
                        : step.status === 'error'
                          ? 'bg-destructive-200'
                          : ''
                    }`}
                  >
                    <span
                      className={`${
                        step.status === 'error'
                          ? 'text-destructive'
                          : step.status === 'success'
                            ? 'text-brand'
                            : 'text-foreground-muted'
                      }`}
                    >
                      {/* &gt; */}
                      <ChevronRight className="w-4 h-4" strokeWidth={1} />
                    </span>
                    <span
                      className={`${
                        step.status === 'success'
                          ? 'text-foreground'
                          : step.status === 'error'
                            ? 'text-foreground'
                            : 'text-foreground-light'
                      }`}
                    >
                      {step.message}
                    </span>
                    {step.timeTaken && (
                      <span
                        className={`ml-auto ${
                          step.status === 'success'
                            ? 'text-brand'
                            : step.status === 'error'
                              ? 'text-destructive'
                              : 'text-foreground-muted'
                        }`}
                      >
                        {step.timeTaken}ms
                      </span>
                    )}
                  </div>
                  {step.errorDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className="mt-2 p-2 px-3 bg-destructive-300"
                    >
                      <pre className="whitespace-pre-wrap text-foreground">
                        {step.errorDetails.split('\n').map((line: string, index: number) => {
                          const [key, ...valueParts] = line.split(':')
                          const value = valueParts.join(':').trim()
                          return (
                            <div key={index}>
                              <span className="text-foreground font-semibold">{key}</span>
                              <span className="text-foreground"> {value}</span>
                            </div>
                          )
                        })}
                      </pre>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const spinnerFrames = ['|', '/', '-', '\\']

interface AsciiSpinnerProps {
  isRunning: boolean
}

export function AsciiSpinner({ isRunning }: AsciiSpinnerProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!isRunning) return

    const timer = setInterval(() => {
      setFrame((prevFrame) => (prevFrame + 1) % spinnerFrames.length)
    }, 100)

    return () => clearInterval(timer)
  }, [isRunning])

  return (
    <span className="inline-block w-4 text-center">{isRunning ? spinnerFrames[frame] : ' '}</span>
  )
}

export { PostgresMutationTerminal }
