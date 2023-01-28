import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { FC, useCallback, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Input, Loading } from '~/../../packages/ui'
import components from '~/components'

type Props = {
  onClose?: () => void
}

const ClippyModal: FC<Props> = ({ onClose }) => {
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

  return (
    <div
      className="flex flex-col items-center fixed top-0 left-0 w-screen h-screen p-4 md:p-[12vh] backdrop-blur-sm z-50 cursor-pointer bg-black/30"
      onClick={onClose}
    >
      <div
        className={`prose dark:prose-dar mx-auto flex flex-col gap-4 rounded-lg p-6 w-full max-w-3xl shadow-2xl overflow-hidden border text-left border-scale-500 dark:bg-scale-300 cursor-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          className="w-full"
          size="xlarge"
          autoFocus
          placeholder="Ask me anything about Supabase"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
        {isLoading && (
          <div className="p-6">
            <Loading active>{}</Loading>
          </div>
        )}
        {answer && (
          <div className="px-8 py-4 dark dark:bg-scale-200 rounded-lg overflow-y-scroll">
            <ReactMarkdown
              linkTarget="_blank"
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
          </div>
        )}
      </div>
    </div>
  )
}

export default ClippyModal
