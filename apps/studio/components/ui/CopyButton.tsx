import { Check, Clipboard } from 'lucide-react'
import React, { forwardRef, useEffect, useState } from 'react'

import { copyToClipboard } from 'lib/helpers'
import { Button, cn } from 'ui'

type CopyButtonBaseProps = {
  iconOnly?: boolean
  copyLabel?: string
  copiedLabel?: string
  onCopy?: () => Promise<string> | string
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
  React.ComponentProps<typeof Button>

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
        onClick={async (e) => {
          const textToCopy = asyncText ? await asyncText() : text
          setShowCopied(true)
          await copyToClipboard(textToCopy!)
          onClick?.(e)
        }}
        {...props}
        className={cn(
          {
            'px-1': iconOnly,
            // '!pointer-events-auto': props.disabled,
          },
          props.className
        )}
        icon={
          showCopied ? (
            <Check strokeWidth={2} className="text-brand" />
          ) : (
            props.icon ?? <Clipboard />
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
