import type { MouseEventHandler } from 'react'
// End of third-party imports

import { Button } from 'ui'

interface SubmitButtonProps {
  isSubmitting: boolean
  userEmail: string
  onClick?: MouseEventHandler<HTMLButtonElement>
}

export function SubmitButton({ isSubmitting, userEmail, onClick }: SubmitButtonProps) {
  return (
    <div className="flex flex-col gap-3">
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
      <p className="text-xs text-foreground-lighter text-balance pr-4">
        We will contact you at <span className="text-foreground font-medium">{userEmail}</span>.
        Please ensure emails from supabase.com are allowed.
      </p>
    </div>
  )
}
