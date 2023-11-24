import { Loader2 } from 'lucide-react'
import { createRef, forwardRef, useEffect } from 'react'
import { TextArea_Shadcn_, cn } from 'ui'

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  loading: boolean
  handleSubmit: () => void
}

const ChatInputAtom = ({ className, loading, handleSubmit, ...props }: TextAreaProps) => {
  const ref = createRef<HTMLTextAreaElement>()

  useEffect(() => {
    if (!props.value && ref && ref.current) {
      ref.current.style.height = '40px'
    } else if (ref && ref.current) {
      console.log('ref.current.scrollHeight', ref.current.scrollHeight)
      const newHeight = ref.current.scrollHeight + 'px'
      console.log('new height', newHeight)
      ref.current.style.height = newHeight
    }
  }, [props.value, ref])

  useEffect(() => {
    ref?.current?.focus()
  }, [props.value, ref])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if the pressed key is "Enter" (key code 13)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      // Manually submit the form
      // value is handled by parent component
      handleSubmit()
    }
  }

  return (
    <form className="relative">
      <div className={cn('absolute', 'top-2 left-2', 'ml-1 w-6 h-6 rounded-full bg-dbnew')}></div>
      <TextArea_Shadcn_
        autoFocus
        className={
          'transition-all text-sm pl-12 pr-10 rounded-[18px] resize-none box-border leading-6'
        }
        ref={ref}
        spellCheck={false}
        onKeyDown={handleKeyDown}
        {...props}
      />
      <div className="absolute right-1.5 top-1.5 flex gap-3 items-center">
        {loading ? (
          <Loader2 size={22} className="animate-spin w-7 h-7 text-muted" strokeWidth={1} />
        ) : (
          <div
            className={cn(
              'transition-all',
              'flex items-center justify-center w-7 h-7 border border-control rounded-full mr-0.5 p-1.5 background-alternative',
              !props.value ? 'text-muted opacity-50' : 'text-default opacity-100'
            )}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.5 3V2.25H15V3V10C15 10.5523 14.5522 11 14 11H3.56062L5.53029 12.9697L6.06062 13.5L4.99996 14.5607L4.46963 14.0303L1.39641 10.9571C1.00588 10.5666 1.00588 9.93342 1.39641 9.54289L4.46963 6.46967L4.99996 5.93934L6.06062 7L5.53029 7.53033L3.56062 9.5H13.5V3Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
        )}
      </div>
    </form>
  )
}

ChatInputAtom.displayName = 'ChatInputAtom'

export { ChatInputAtom }
