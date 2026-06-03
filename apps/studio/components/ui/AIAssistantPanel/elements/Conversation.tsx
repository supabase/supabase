import { ArrowDownIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useCallback } from 'react'
import { Button, cn } from 'ui'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'

type ConversationProps = ComponentProps<typeof StickToBottom> & {
  bottomFadeClassName?: string
}
type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>
type ConversationScrollButtonProps = ComponentProps<typeof Button>

export const Conversation = ({
  className,
  bottomFadeClassName,
  children,
  ...props
}: ConversationProps) => (
  <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
    <StickToBottom
      className="flex min-h-0 flex-1 flex-col"
      initial="smooth"
      resize="smooth"
      role="log"
      {...props}
    >
      {children}
    </StickToBottom>
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-linear-to-t from-background to-transparent',
        bottomFadeClassName
      )}
    />
  </div>
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
        className={cn(
          'absolute bottom-4 left-[50%] z-20 translate-x-[-50%] rounded-full',
          className
        )}
        onClick={handleScrollToBottom}
        size="tiny"
        type="default"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  )
}
