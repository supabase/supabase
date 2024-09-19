import { Check, Clipboard } from 'lucide-react'
import { useEffect, useState } from 'react'

import { copyToClipboard } from 'lib/helpers'
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
      onClick={async (e) => {
        setShowCopied(true)
        await copyToClipboard(text)
        onClick?.(e)
      }}
      icon={showCopied ? <Check strokeWidth={2} className="text-brand" /> : <Clipboard />}
      {...props}
    >
      {!iconOnly && <>{children ?? (showCopied ? copiedLabel : copyLabel)}</>}
    </Button>
  )
}
export default CopyButton
