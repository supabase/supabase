'use client'

import { ReactNode, useRef, useState } from 'react'
import { useActions } from 'ai/rsc'
import { Message } from '@/src/components/chat/message'
import { useScrollToBottom } from '@/src/components/chat/use-scroll-to-bottom'
import { motion } from 'framer-motion'
import { MasonryIcon, VercelIcon } from '@/src/components/chat/icons'
import Link from 'next/link'

export default function Home() {
  const { sendMessage } = useActions()

  const [input, setInput] = useState<string>('')
  const [messages, setMessages] = useState<Array<ReactNode>>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>()

  const suggestedActions = [
    { title: 'View all', label: 'my cameras', action: 'View all my cameras' },
    { title: 'Show me', label: 'my smart home hub', action: 'Show me my smart home hub' },
    {
      title: 'How much',
      label: 'electricity have I used this month?',
      action: 'Show electricity usage',
    },
    {
      title: 'How much',
      label: 'water have I used this month?',
      action: 'Show water usage',
    },
    {
      title: 'Show me',
      label: 'database stats',
      action: 'View database stats',
    },
  ]

  return (
    <div className="flex flex-row justify-center pb-20 h-dvh bg-white dark:bg-zinc-900">
      <div className="flex flex-col justify-between gap-4">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-3 h-full w-dvw items-center overflow-y-scroll"
        >
          {messages.length === 0 && (
            <motion.div className="h-[350px] px-4 w-full md:w-[500px] md:px-0 pt-20">
              <div className="border rounded-lg p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
                <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50">
                  <VercelIcon size={16} />
                  <span>+</span>
                  <MasonryIcon />
                </p>
                <p>
                  The streamUI function allows you to stream React Server Components along with your
                  language model generations to integrate dynamic user interfaces into your
                  application.
                </p>
                <p>
                  {' '}
                  Learn more about the{' '}
                  <Link
                    className="text-blue-500 dark:text-blue-400"
                    href="https://sdk.vercel.ai/docs/ai-sdk-rsc/streaming-react-components"
                    target="_blank"
                  >
                    streamUI{' '}
                  </Link>
                  hook from Vercel AI SDK.
                </p>
              </div>
            </motion.div>
          )}
          {messages.map((message) => message)}
          <div ref={messagesEndRef} />
        </div>

        <div className="grid sm:grid-cols-2 gap-2 w-full px-4 md:px-0 mx-auto md:max-w-[500px] mb-4">
          {messages.length === 0 &&
            suggestedActions.map((action, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.01 * index }}
                key={index}
                className={index > 1 ? 'hidden sm:block' : 'block'}
              >
                <button
                  onClick={async () => {
                    setMessages((messages) => [
                      ...messages,
                      <Message key={messages.length} role="user" content={action.action} />,
                    ])
                    const response: ReactNode = await sendMessage(action.action)
                    setMessages((messages) => [...messages, response])
                  }}
                  className="w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
                >
                  <span className="font-medium">{action.title}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">{action.label}</span>
                </button>
              </motion.div>
            ))}
        </div>

        <form
          className="flex flex-col gap-2 relative items-center"
          onSubmit={async (event) => {
            event.preventDefault()

            setMessages((messages) => [
              ...messages,
              <Message key={messages.length} role="user" content={input} />,
            ])
            setInput('')

            const response: ReactNode = await sendMessage(input)
            setMessages((messages) => [...messages, response])
          }}
        >
          <input
            ref={inputRef}
            className="bg-zinc-100 rounded-md px-2 py-1.5 w-full outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300 md:max-w-[500px] max-w-[calc(100dvw-32px)]"
            placeholder="Send a message..."
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
            }}
          />
        </form>
      </div>
    </div>
  )
}
