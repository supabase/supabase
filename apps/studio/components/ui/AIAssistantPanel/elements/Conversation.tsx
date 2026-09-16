import { ArrowDownIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Button, cn } from 'ui'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'

type ConversationProps = Omit<ComponentProps<typeof StickToBottom>, 'children'> & {
  children?: ReactNode
}
type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>
type ConversationScrollButtonProps = ComponentProps<typeof Button>

/** `inset-x-0` spans the scrollbar gutter, so the fades stop short of the measured scrollbar. */
const ConversationFade = () => {
  const { scrollRef } = useStickToBottomContext()
  const [scrollbarWidth, setScrollbarWidth] = useState(0)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const measure = () => setScrollbarWidth(element.offsetWidth - element.clientWidth)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [scrollRef])

  return (
    <>
      <div
        aria-hidden
        style={{ right: scrollbarWidth }}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-linear-to-b from-card to-transparent"
      />
      <div
        aria-hidden
        style={{ right: scrollbarWidth }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-linear-to-t from-card to-transparent"
      />
    </>
  )
}

export const Conversation = ({ className, children, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn('relative flex-1 overflow-y-auto', className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  >
    <ConversationFade />
    {children}
  </StickToBottom>
)

export const ConversationContent = ({ className, ...props }: ConversationContentProps) => (
  <StickToBottom.Content className={cn('p-4', className)} {...props} />
)

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom()
  }, [scrollToBottom])

  return (
    !isAtBottom && (
      <Button
        className={cn('absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full', className)}
        onClick={handleScrollToBottom}
        size="tiny"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  )
}
