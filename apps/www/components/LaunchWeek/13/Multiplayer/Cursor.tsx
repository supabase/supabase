import { useBreakpoint } from 'common'
import { FC, useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

interface Props {
  x?: number
  y?: number
  color: string
  hue: string
  message: string
  isCurrentUser: boolean
  isTyping: boolean
  isCancelled?: boolean
  isLocalClient?: boolean
  onUpdateMessage?: (message: string) => void
}

const MAX_DURATION = 4000

const Cursor: FC<Props> = ({
  x,
  y,
  color,
  hue,
  message,
  isCurrentUser,
  isTyping,
  isCancelled,
  isLocalClient,
  onUpdateMessage = () => {},
}) => {
  const _isLocalClient = !x || !y
  const inputRef = useRef() as any
  const timeoutRef = useRef() as any
  const chatBubbleRef = useRef() as any
  const isMobile = useBreakpoint('sm')

  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [hideInput, setHideInput] = useState(false)
  const [showMessageBubble, setShowMessageBubble] = useState(false)

  useEffect(() => {
    if (isTyping) {
      setShowMessageBubble(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      if (isLocalClient) {
        if (inputRef.current) inputRef.current.focus()
        setHideInput(false)
      }
    } else {
      if (!message || isCancelled) {
        setShowMessageBubble(false)
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (isLocalClient) setHideInput(true)
        const timeoutId = setTimeout(() => {
          setShowMessageBubble(false)
        }, MAX_DURATION)
        timeoutRef.current = timeoutId
      }
    }
  }, [isLocalClient, isTyping, isCancelled, message, inputRef])

  useEffect(() => {
    // touchscreen
    if (window.matchMedia('(pointer: coarse)').matches && isMobile) {
      setIsTouchDevice(true)
    }
  }, [isMobile])

  if (isCurrentUser && isTouchDevice) return null

  return (
    <>
      {!_isLocalClient && (
        <svg
          width="18"
          height="21"
          viewBox="0 0 18 21"
          fill="none"
          className={cn(
            'absolute top-0 left-0 transform transition pointer-events-none z-0',
            isCurrentUser && 'transition-none z-40'
          )}
          style={{ color, transform: `translateX(${x}px) translateY(${y}px)` }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.19777 1.00263C3.10663 0.0999637 1.45741 0.876037 1.45741 2.29215V18.767C1.45741 20.368 3.48943 21.0551 4.4611 19.7827L8.48462 14.5138C8.59593 14.368 8.76885 14.2825 8.95226 14.2825H15.6018C17.1701 14.2825 17.877 12.3191 16.6686 11.3194L4.19777 1.00263Z"
            fill={hue}
            stroke={color}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <div
        ref={chatBubbleRef}
        className={cn(
          'transition-all absolute top-0 left-0 py-2 rounded-full shadow-md',
          'flex items-center justify-between px-4 space-x-2 pointer-events-none',
          `${showMessageBubble ? 'opacity-100' : 'opacity-0'}`,
          `${_isLocalClient && !hideInput ? 'w-[280px]' : 'max-w-[280px] overflow-hidden'}`
        )}
        style={{
          backgroundColor: color,
          transform: `translateX(${(x || 0) + 20}px) translateY(${(y || 0) + 20}px)`,
        }}
      ></div>
    </>
  )
}

export default Cursor
