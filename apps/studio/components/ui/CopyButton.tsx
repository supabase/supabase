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
      type = 'primary',
      icon,
      className,
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
        onClick={(e) => {
          const textToCopy = asyncText ? asyncText() : text
          setShowCopied(true)
          copyToClipboard(textToCopy)
          onClick?.(e)
        }}
        {...props}
        type={type}
        className={cn({ 'px-1': iconOnly }, className)}
        icon={
          showCopied ? (
            <Check
              strokeWidth={2}
              className={cn(type === 'primary' ? 'text-inherit' : 'text-brand')}
            />
          ) : (
            (icon ?? <Copy />)
          )
        }
      >
        {!iconOnly && <>{children ?? (showCopied ? copiedLabel : copyLabel)}</>}
      </Button>
    )
  }
)

CopyButton.displayName = 'CopyButton'

export default CopyButton
