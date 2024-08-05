import { copyToClipboard } from 'lib/helpers'
import { Check, Clipboard } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, ButtonProps } from 'ui'

export interface CopyButtonProps extends ButtonProps {
  text: string
  iconOnly?: boolean
  copyLabel?: string
  copiedLabel?: string
}
const CopyButton = ({
  text,
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
      onClick={(e) => {
        setShowCopied(true)
        copyToClipboard(text)
        onClick?.(e)
      }}
      icon={
        showCopied ? (
          <Check size={14} strokeWidth={2} className="text-brand" />
        ) : (
          <Clipboard size={14} />
        )
      }
      {...props}
    >
      {!iconOnly && <>{children ?? (showCopied ? copiedLabel : copyLabel)}</>}
    </Button>
  )
}
export default CopyButton
