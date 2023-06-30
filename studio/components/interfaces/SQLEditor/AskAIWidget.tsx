import { detectOS } from 'lib/helpers'
import { useCallback } from 'react'
import { AiIcon, IconCornerDownLeft, Input } from 'ui'

const AskAIWidget = () => {
  const os = detectOS()

  // Auto focus input
  const inputRef = useCallback((input: HTMLInputElement | null) => {
    setTimeout(() => {
      input?.focus()
    }, 0)
  }, [])

  return (
    <div className="bg-scale-200 rounded-md p-2 my-2 border border-scale-700 shadow-xl shadow-scale-100 flex flex-col gap-2 text-sm text-scale-1100 max-w-xl">
      <Input
        inputRef={inputRef}
        size="xlarge"
        icon={<AiIcon className="w-4 h-4 ml-1" />}
        inputClassName="bg-scale-100 placeholder:text-scale-900 rounded-sm focus:!border-brand-900"
        iconContainerClassName="transition text-scale-800 peer-focus/input:text-brand-900"
        placeholder="Ask Supabase AI to do something"
        autoFocus
        actions={
          <div className="flex items-center space-x-1 mr-6">
            {os === 'macos' ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 5H7.76472L16.2353 19H21M16.2353 5H21"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <p className="text-xs text-scale-1100">ALT</p>
            )}
            <IconCornerDownLeft size={16} strokeWidth={1.5} />
          </div>
        }
      />
      AI generated code may be incorrect.
    </div>
  )
}

export default AskAIWidget
