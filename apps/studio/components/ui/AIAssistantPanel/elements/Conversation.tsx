import { ArrowDownIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { useCallback } from 'react'
import { Button, cn } from 'ui'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'

type ConversationProps = Omit<ComponentProps<typeof StickToBottom>, 'children'> & {
  children?: ReactNode
}
type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>
type ConversationScrollButtonProps = ComponentProps<typeof Button>

/**
 * Horizontal gutter the conversation reserves around its content. The fades overlay the scroll
 * container, whose scrollbar runs down the right edge, so they stop at this gutter instead of
 * spanning the full width.
 */
const CONTENT_GUTTER = 'px-7'
const FADE_GUTTER = 'inset-x-7'

export const Conversation = ({ className, children, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn('relative flex-1 overflow-y-auto', className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  >
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute top-0 z-10 h-8 bg-linear-to-b from-card to-transparent',
        FADE_GUTTER
      )}
    />
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute bottom-0 z-10 h-8 bg-linear-to-t from-card to-transparent',
        FADE_GUTTER
      )}
    />
    {children}
  </StickToBottom>
)

export const ConversationContent = ({ className, ...props }: ConversationContentProps) => (
  <StickToBottom.Content className={cn(CONTENT_GUTTER, 'py-4', className)} {...props} />
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
