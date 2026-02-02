import { Check, Copy } from 'lucide-react'
import { ComponentProps, forwardRef, useEffect, useState } from 'react'
import { Button, cn, copyToClipboard } from 'ui'

type CopyButtonBaseProps = {
  iconOnly?: boolean
  copyLabel?: string
  copiedLabel?: string
}

type CopyButtonWithText = CopyButtonBaseProps & {
  text: string
  asyncText?: never
}

type CopyButtonWithAsyncText = CopyButtonBaseProps & {
  text?: never
  asyncText: () => Promise<string> | string
}

export type CopyButtonProps = (CopyButtonWithText | CopyButtonWithAsyncText) &
  ComponentProps<typeof Button>

const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      text,
      asyncText,
      iconOnly = false,
      children,
      onClick,
      copyLabel = 'Copy',
      copiedLabel = 'Copied',
      ...props
    },
    ref
  ) => {
    const [showCopied, setShowCopied] = useState(false)

    useEffect(() => {
      if (!showCopied) return
      const timer = setTimeout(() => setShowCopied(false), 2000)
      return () => clearTimeout(timer)
    }, [showCopied])

    return (
      <Button
        ref={ref}
        onPointerDownCapture={(e) => {
          // Safari requires clipboard operations to happen on pointerdown (not click)
          // and in the capture phase (before the event reaches child elements like icons).
          // Without this, Safari's user gesture detection fails.
          if (e.button !== 0) return // Only handle left click
          const textToCopy = asyncText ? asyncText() : text
          setShowCopied(true)
          copyToClipboard(textToCopy)
        }}
        onClick={onClick}
        {...props}
        className={cn({ 'px-1': iconOnly }, props.className)}
        icon={
          showCopied ? <Check strokeWidth={2} className="text-brand" /> : props.icon ?? <Copy />
        }
      >
        {!iconOnly && <>{children ?? (showCopied ? copiedLabel : copyLabel)}</>}
      </Button>
    )
  }
)

CopyButton.displayName = 'CopyButton'

export default CopyButton
