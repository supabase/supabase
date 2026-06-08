import type { MouseEventHandler } from 'react'
// End of third-party imports

import { Button, cn } from 'ui'

interface SubmitButtonProps {
  isSubmitting: boolean
  userEmail: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
  descriptionClassName?: string
}

export function SubmitButton({
  isSubmitting,
  userEmail,
  onClick,
  className,
  descriptionClassName,
}: SubmitButtonProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <Button
        htmlType="submit"
        size="small"
        block
        disabled={isSubmitting}
        loading={isSubmitting}
        onClick={onClick}
      >
        Send support request
      </Button>
      <p className={cn('text-xs text-foreground-lighter text-balance pr-4', descriptionClassName)}>
        We will contact you at <span className="text-foreground font-medium">{userEmail}</span>.
        Please ensure emails from supabase.com are allowed.
      </p>
    </div>
  )
}
