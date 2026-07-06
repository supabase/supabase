'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'

const COMMAND = 'supabase functions serve'
const OUTPUT = 'Functions listening on 127.0.0.1:54321/functions/v1/'

const LocalDXImage = ({ isHovered = false }: { isHovered?: boolean }) => {
  const [copied, setCopied] = useState(false)
  const [visibleChars, setVisibleChars] = useState(COMMAND.length)
  const [showOutput, setShowOutput] = useState(false)
  const visibleCharsRef = useRef(COMMAND.length)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  const setChars = (n: number) => {
    visibleCharsRef.current = n
    setVisibleChars(n)
  }

  useEffect(() => {
    clearTimeouts()
    if (isHovered) {
      setShowOutput(false)
      setChars(0)
      COMMAND.split('').forEach((_, i) => {
        const t = setTimeout(() => setChars(i + 1), i * 40)
        timeoutsRef.current.push(t)
      })
      // Show output line shortly after typing completes
      const t = setTimeout(() => setShowOutput(true), COMMAND.length * 40 + 120)
      timeoutsRef.current.push(t)
    } else {
      setShowOutput(false)
      const current = visibleCharsRef.current
      for (let i = current; i < COMMAND.length; i++) {
        const t = setTimeout(() => setChars(i + 1), (i - current) * 18)
        timeoutsRef.current.push(t)
      }
    }
    return clearTimeouts
  }, [isHovered])

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <div className="relative w-full h-full flex-1 flex items-center justify-center px-4 xl:px-6">
      <Image
        src="/images/product/functions/lines-gradient-light.svg"
        alt=""
        fill
        sizes="100%"
        aria-hidden
        draggable={false}
        className="object-cover absolute z-0 inset-0 dark:hidden block"
      />
      <Image
        src="/images/product/functions/lines-gradient-dark.svg"
        alt=""
        fill
        sizes="100%"
        aria-hidden
        draggable={false}
        className="object-cover absolute z-0 inset-0 hidden dark:block"
      />
      <CopyToClipboard text="supabase functions serve <function-name>">
        <button
          onClick={handleCopy}
          className="p-3 relative z-10 w-full group hover:border-strong flex gap-2 items-center bg-alternative-200 rounded-xl border overflow-hidden"
        >
          <div className="text-foreground-muted text-sm font-mono shrink-0">$</div>

          {/* Slot: command ↔ output, same position */}
          <div className="relative flex-1 min-w-0 text-sm font-mono h-5">
            {/* Ghost text stabilises width */}
            <span className="invisible select-none whitespace-nowrap">{COMMAND}</span>

            <AnimatePresence mode="wait" initial={false}>
              {!showOutput ? (
                <motion.span
                  key="cmd"
                  className="absolute inset-0 flex items-center text-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  {COMMAND.slice(0, visibleChars)}
                  {isHovered && visibleChars < COMMAND.length && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
                      className="inline-block w-[1.5px] h-[14px] bg-foreground align-middle ml-px shrink-0"
                    />
                  )}
                </motion.span>
              ) : (
                <motion.span
                  key="output"
                  className="absolute inset-0 flex items-center gap-1.5 text-foreground-muted truncate"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <span className="truncate">{OUTPUT}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="text-foreground rounded p-1.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {copied ? (
              <span className="text-brand">
                <Check className="w-3.5 h-3.5" />
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </div>
        </button>
      </CopyToClipboard>
    </div>
  )
}
export default LocalDXImage
