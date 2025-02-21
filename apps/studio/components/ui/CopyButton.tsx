import { Check, Clipboard } from 'lucide-react'
import { useEffect, useState } from 'react'

import { copyToClipboard } from 'lib/helpers'
import { Button, ButtonProps, cn } from 'ui'

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

export type CopyButtonProps = (CopyButtonWithText | CopyButtonWithAsyncText) & ButtonProps

const CopyButton = ({
  text,
  asyncText,
  iconOnly = false,
  children,
  onClick,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
  ...props
}: CopyButtonProps) => {
  const [showCopied, setShowCopied] = useState(false)

  useEffect(() => {
    if (!showCopied) return
    const timer = setTimeout(() => setShowCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [showCopied])

  return (
    <Button
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
        },
        props.className
      )}
      icon={
        showCopied ? <Check strokeWidth={2} className="text-brand" /> : props.icon ?? <Clipboard />
      }
    >
      {!iconOnly && <>{children ?? (showCopied ? copiedLabel : copyLabel)}</>}
    </Button>
  )
}

export default CopyButton
