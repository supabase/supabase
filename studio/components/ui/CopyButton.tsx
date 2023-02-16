import { Button, ButtonProps } from 'ui'
import { copyToClipboard } from 'lib/helpers'
import { IconClipboard } from 'ui'
import { useEffect, useState } from 'react'

export interface CopyButtonProps extends ButtonProps {
  text: string
  // used for text-less feedback
  bounceIconOnCopy?: boolean
}
const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  children,
  onClick,
  bounceIconOnCopy,
  ...props
}) => {
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
        <IconClipboard
          size="tiny"
          className={[showCopied && bounceIconOnCopy ? 'animate-bounce' : '', 'transition'].join(
            ' '
          )}
        />
      }
      {...props}
    >
      {children ?? (showCopied ? 'Copied' : 'Copy')}
    </Button>
  )
}
export default CopyButton
