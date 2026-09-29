import { ArrowDownIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { useCallback } from 'react'
import { Button, cn, FloatingPlate } from 'ui'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'

type ConversationProps = Omit<ComponentProps<typeof StickToBottom>, 'children'> & {
  children?: ReactNode
}
type ConversationContentProps = ComponentProps<typeof StickToBottom.Content> & {
  scrollClassName?: string
}
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
    className={cn('relative min-h-0 flex-1 overflow-hidden', className)}
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

export const ConversationContent = ({
  className,
  scrollClassName,
  children,
  ...props
}: ConversationContentProps) => {
  const context = useStickToBottomContext()

  return (
    <div
      ref={context.scrollRef}
      className={cn('h-full w-full overflow-auto overscroll-y-contain', scrollClassName)}
    >
      <div {...props} ref={context.contentRef} className={cn(CONTENT_GUTTER, 'py-4', className)}>
        {typeof children === 'function' ? children(context) : children}
      </div>
    </div>
  )
}

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
      <FloatingPlate rounded="full" className="absolute bottom-4 left-[50%] translate-x-[-50%]">
        <Button
          className={cn('rounded-full', className)}
          onClick={handleScrollToBottom}
          size="tiny"
          {...props}
        >
          <ArrowDownIcon className="size-4" />
        </Button>
      </FloatingPlate>
    )
  )
}
