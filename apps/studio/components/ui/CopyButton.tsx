import { Button, ButtonProps, IconCheck, IconClipboard } from 'ui'
import { copyToClipboard } from 'lib/helpers'
import { useEffect, useState } from 'react'

export interface CopyButtonProps extends ButtonProps {
  text: string
  iconOnly?: boolean
}
const CopyButton = ({ text, iconOnly = false, children, onClick, ...props }: CopyButtonProps) => {
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
          <IconCheck size="tiny" strokeWidth={2} className="text-brand" />
        ) : (
          <IconClipboard size="tiny" />
        )
      }
      {...props}
    >
      {!iconOnly && <>{children ?? (showCopied ? 'Copied' : 'Copy')}</>}
    </Button>
  )
}
export default CopyButton
