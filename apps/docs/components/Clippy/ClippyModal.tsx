import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { FC, useCallback, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import clippyImageDark from '../../public/img/clippy-dark.png'
import clippyImage from '../../public/img/clippy.png'

import { useTheme } from 'common/Providers'
import Image from 'next/image'
import { Button, IconAlertCircle, IconChevronRight, IconSearch, Input, Loading, Modal } from 'ui'
import components from '~/components'

type Props = {
  onClose?: () => void
}

const questions = [
  'How do I get started with Supabase?',
  'How do I run Supabase locally?',
  'How do I connect to my database?',
]

const ClippyModal: FC<Props> = ({ onClose }) => {
  const { isDarkMode } = useTheme()
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const supabaseClient = useSupabaseClient()

  const handleConfirm = useCallback(async () => {
    setAnswer(undefined)
    setIsLoading(true)

    const response = await supabaseClient.functions.invoke('clippy-search', { body: { query } })

    setIsLoading(false)

    // TODO: display an error on the UI
    if (response.error) {
      console.error('Clippy search failed', response.error)
      return
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
  }

  return (
    <Modal size="xlarge" visible={true} onCancel={onClose} hideFooter closable={false}>
      <div
        className={`mx-auto flex flex-col gap-4 rounded-lg p-6 w-full max-w-3xl shadow-2xl overflow-hidden border text-left border-scale-500 bg-scale-300 cursor-auto relative`}
        onClick={(e) => e.stopPropagation()}
      >
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

        {!isLoading && !answer && (
          <div className="flex justify-between relative">
            <div className="mt-2">
              <h2 className="text-xs text-scale-900">Not sure where to start?</h2>

              <ul className="text-xs leading-7 mt-1 text-scale-1000">
                {questions.map((question) => (
                  <li className="flex gap-1 items-center">
                    <IconChevronRight width={12} height={12} />
                    <button
                      className="hover:underline"
                      onClick={() => handleQueryPreload(question)}
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute bottom-4 right-4">
              <Image
                width={45}
                height={48}
                src={isDarkMode ? clippyImageDark : clippyImage}
                alt="Clippy"
              />
            </div>
          </div>
        )}
        {isLoading && (
          <div className="p-6">
            <Loading active>{}</Loading>
          </div>
        )}
        {answer && (
          <div className={`clippy-modal-container px-4 py-4 dark rounded-lg overflow-y-scroll`}>
            {answer.includes('Sorry, I don') ? (
              <p className="flex gap-4">
                <IconAlertCircle /> Sorry, I don&apos;t know how to help with that.{' '}
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
      </div>
    </Modal>
  )
}

export default ClippyModal
