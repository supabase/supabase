import { Button, ButtonProps } from 'ui'
import { copyToClipboard } from 'lib/helpers'
import { IconClipboard } from 'ui'
import { useEffect, useState } from 'react'

export interface CopyButtonProps extends ButtonProps {
  text: string
}
const CopyButton: React.FC<CopyButtonProps> = ({ text, children, onClick, ...props }) => {
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
      icon={<IconClipboard size="tiny" />}
      {...props}
    >
      {children ?? (showCopied ? 'Copied' : 'Copy')}
    </Button>
  )
}
export default CopyButton
