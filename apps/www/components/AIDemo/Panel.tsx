// components/AIDemoPanel.tsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Input } from 'ui'
import { AiIconAnimation, cn } from 'ui'
import errorGif from 'public/images/ai/error.gif'
import Image from 'next/image'
import styles from './assistant.module.css'

interface DemoMessage {
  id: string
  role: 'user' | 'assistant'
  content: string | React.ReactNode
  render?: React.ReactNode
  createdAt: Date
}

export const AIDemoPanel = ({ incomingMessages = [] }: { incomingMessages?: DemoMessage[] }) => {
  const [messages, setMessages] = useState<DemoMessage[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [pendingMessages, setPendingMessages] = useState<DemoMessage[]>([])
  const [input, setInput] = useState('')
  const [showFade, setShowFade] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    const container = messagesEndRef.current?.closest('.overflow-y-auto')
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (container) {
      const scrollPercentage =
        (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100
      const isScrollable = container.scrollHeight > container.clientHeight
      const isAtBottom = scrollPercentage >= 100

      setShowFade(isScrollable && !isAtBottom)
    }
  }

  useEffect(() => {
    scrollToBottom()
    handleScroll()
  }, [messages])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll()
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  useEffect(() => {
    if (pendingMessages.length > 0) {
      const timer = setTimeout(() => {
        setMessages((prev) => [...prev, pendingMessages[0]])
        setPendingMessages((prev) => prev.slice(1))
      }, 3000)
      return () => clearTimeout(timer)
    } else if (!isComplete) {
      setIsComplete(true)
    }
  }, [isComplete, pendingMessages])

  useEffect(() => {
    if (incomingMessages.length > 0) {
      setMessages((prev) => [...prev, ...pendingMessages, incomingMessages[0]])
      setPendingMessages(incomingMessages.slice(1))
    }
  }, [incomingMessages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: DemoMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    }

    const assistantMessage: DemoMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: (
        <div className="rounded-md overflow-hidden relative">
          <Image
            src={errorGif}
            alt="Try the assistant in your dashboard for real results"
            className="w-full grayscale"
          />
        </div>
      ),
      createdAt: new Date(),
    }

    const followUp: DemoMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: "Sorry, custom queries aren't supported in this demo.",
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setPendingMessages((prev) => [...prev, assistantMessage, followUp])
    setInput('')
  }

  return (
    <div className="w-full shadow-2xl relative h-full bg-surface-75 border border-text-light/25 rounded-md overflow-hidden">
      <div className="absolute inset-0 flex flex-col">
        {/* Header */}
        <div className="z-30 border-b border-b-muted flex items-center gap-x-3 px-5 h-[46px]">
          <AiIconAnimation loading={false} allowHoverEffect />
          <div className="text-sm flex-1">Assistant</div>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-5 flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {messages.map((message, index) => (
            <>
              <motion.div
                key={index}
                layout="position"
                initial={{ y: 5, opacity: 0, scale: 0.99 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                className={cn(
                  'text-foreground-light text-sm mb-6',
                  message.role === 'user'
                    ? 'px-5 py-3 rounded-lg bg-background-muted/80 w-fit self-end max-w-64'
                    : ''
                )}
              >
                {message.content}
                {message.render && <div className="mt-4">{message.render}</div>}
              </motion.div>
            </>
          ))}
          {messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <motion.div className="text-foreground-lighter text-sm flex gap-1.5 items-center">
              <span>Thinking</span>
              <div className="flex gap-1">
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                >
                  .
                </motion.span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <AnimatePresence>
          {showFade && (
            <motion.div
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pointer-events-none z-10 -mt-24"
            >
              <div className="h-24 w-full bg-gradient-to-t from-background muted to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="p-5 pt-0 relative z-10">
          <form onSubmit={handleSubmit} className={cn('rounded-md', styles['border-gradient'])}>
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your data anything..."
              className={cn(
                'w-full bg-background-muted rounded-md [&>textarea]:border-1 [&>textarea]:rounded-md [&>textarea]:!outline-none [&>textarea]:!ring-offset-0 [&>textarea]:!ring-0 focus:outline-none'
              )}
            />
          </form>
        </div>
      </div>
    </div>
  )
}
