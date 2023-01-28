import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { FC, useCallback, useState } from 'react'
import { Input } from '~/../../packages/ui'

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
        className={`mx-auto flex flex-col gap-6 rounded-lg p-6 w-full max-w-2xl shadow-2xl overflow-hidden border text-left border-scale-500 dark:bg-scale-300 cursor-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          className="w-full"
          size="xlarge"
          autoFocus
          placeholder="What can I help you with?"
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
        {isLoading && 'Loading'}
        {answer && <div>{answer}</div>}
      </div>
    </div>
  )
}

export default ClippyModal
