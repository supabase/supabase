import { m } from 'framer-motion'
import { useCallback } from 'react'
import { AiIcon, IconCornerDownLeft, Input } from 'ui'

const AskAIWidget = () => {
  // Auto focus input
  const inputRef = useCallback((input: HTMLInputElement | null) => {
    setTimeout(() => {
      input?.focus()
    }, 0)
  }, [])

  return (
    <m.div
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      className="bg-scale-200 rounded-md p-2 my-2 border border-scale-700 shadow-xl shadow-scale-100 flex flex-col gap-2 text-sm text-scale-1100 max-w-xl"
    >
      <m.div initial={{ y: -25 }} animate={{ y: 0 }}>
        <Input
          inputRef={inputRef}
          size="xlarge"
          icon={<AiIcon className="w-4 h-4 ml-1" />}
          inputClassName="bg-scale-100 placeholder:text-scale-900 rounded-sm focus:!border-brand-900"
          iconContainerClassName="transition text-scale-800 peer-focus/input:text-brand-900"
          placeholder="Ask Supabase AI to edit this query"
          autoFocus
          actions={
            <div className="flex items-center space-x-1 mr-4">
              <IconCornerDownLeft size={16} strokeWidth={1.5} />
            </div>
          }
        />
      </m.div>
      AI generated code may be incorrect.
    </m.div>
  )
}

export default AskAIWidget
