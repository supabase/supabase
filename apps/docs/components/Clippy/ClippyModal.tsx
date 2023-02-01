import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { FC, useCallback, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import clippyImageDark from '../../public/img/clippy-dark.png'
import clippyImage from '../../public/img/clippy.png'

import { useTheme } from 'common/Providers'
import Image from 'next/image'
import { Button, IconAlertCircle, IconLoader, IconSearch, Input, Loading, Modal } from 'ui'
import components from '~/components'

type Props = {
  onClose?: () => void
}

const questions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
  'How do I run migrations? ',
  'How do I listen to changes in a table?',
]

const ClippyModal: FC<Props> = ({ onClose }) => {
  const { isDarkMode } = useTheme()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [answer, setAnswer] = useState('')
  const [cantHelp, setCantHelp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabaseClient = useSupabaseClient()

  const handleConfirm = useCallback(async () => {
    setAnswer(undefined)
    setIsLoading(true)
    setStatus('Clippy is searching...')

    const response = await supabaseClient.functions.invoke('clippy-search', { body: { query } })

    setIsLoading(false)
    setStatus('')

    // TODO: display an error on the UI
    if (response.error) {
      console.error('Clippy search failed', response.error)
      return
    }

    if (response.data.answer.includes('Sorry, I don')) {
      setCantHelp(true)
      setStatus('Clippy has faild you')
    } else {
      setStatus('')
      setCantHelp(false)
    }

    setAnswer(response.data.answer)
  }, [query, supabaseClient])

  function handleQueryPreload(question: string) {
    setQuery(question)
    handleConfirm()
  }

  function handleResetPrompt() {
    setQuery('')
    setAnswer(undefined)
    setStatus('')
    setCantHelp(false)
  }

  return (
    <Modal size="xlarge" visible={true} onCancel={onClose} closable={false} hideFooter>
      <div
        className={`mx-auto flex flex-col gap-4 rounded-lg pt-6 px-6 pb-2 w-full max-w-3xl shadow-2xl overflow-hidden border text-left border-scale-500 bg-scale-100 dark:bg-scale-300 cursor-auto relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Input
            className="w-full"
            size="xlarge"
            autoFocus
            placeholder="Ask me anything about Supabase"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<IconSearch size="small" />}
            onKeyDown={(e) => {
              switch (e.key) {
                case 'Enter':
                  handleConfirm()
                  return
                default:
                  return
              }
            }}
          />
          <div className="absolute right-0 top-0 mt-3 mr-4">
            <Button type="default" size="tiny" onClick={onClose}>
              esc
            </Button>
          </div>
        </div>

        {!isLoading && !answer && (
          <div className="">
            <div className="mt-2">
              <h2 className="text-xs text-scale-900">Not sure where to start?</h2>

              <ul className="text-xs mt-4 text-scale-1000 flex gap-4 flex-wrap max-w-3xl">
                {questions.map((question) => (
                  <li>
                    <button
                      className="hover:bg-slate-400 hover:dark:bg-slate-400 px-4 py-2 bg-slate-300 dark:bg-slate-200 rounded-lg transition-colors"
                      onClick={() => handleQueryPreload(question)}
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="p-6 grid gap-6 mt-4">
            <Loading active>{}</Loading>
            <p className="text-lg text-center">Searching for results</p>
          </div>
        )}
        {answer && (
          <div className="px-4 py-4 dark rounded-lg overflow-y-scroll">
            {answer.includes('Sorry, I don') ? (
              <p className="flex flex-col gap-4 items-center">
                <div className="flex items-center gap-2 mt-4">
                  <IconAlertCircle />
                  <p>Sorry, I don&apos;t know how to help with that.</p>
                </div>
                <Button size="tiny" type="secondary" onClick={handleResetPrompt}>
                  Try again?
                </Button>
              </p>
            ) : (
              <ReactMarkdown
                linkTarget="_blank"
                remarkPlugins={[remarkGfm]}
                transformLinkUri={(href) => {
                  const supabaseUrl = new URL('https://supabase.com')
                  const linkUrl = new URL(href, 'https://supabase.com')

                  if (linkUrl.origin === supabaseUrl.origin) {
                    return linkUrl.toString()
                  }

                  return href
                }}
                components={components}
              >
                {answer}
              </ReactMarkdown>
            )}
          </div>
        )}
        <div className="border-t border-scale-600 mt-4 text-scale-900">
          <div className="flex justify-between items-center py-2 text-xs">
            <div className="flex items-centerp gap-1 pt-3 pb-1">
              Powered by OpenAI.{' '}
              <a href="" className="underline">
                Read the blog post
              </a>{' '}
              →
            </div>
            <div className="flex items-center gap-6 py-1">
              {isLoading || cantHelp ? (
                <span className="bg-scale-400 rounded-lg py-1 px-2 flex items-center gap-2">
                  {isLoading && <IconLoader size={14} className="animate-spin" />}
                  {status}
                </span>
              ) : (
                <></>
              )}
              <Image
                width={30}
                height={34}
                src={isDarkMode ? clippyImageDark : clippyImage}
                alt="Clippy"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ClippyModal
