import { Mail } from 'lucide-react'
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
    <div className={'flex flex-col items-end gap-3'}>
      <Button
        htmlType="submit"
        size="large"
        block
        icon={<Mail />}
        disabled={isSubmitting}
        loading={isSubmitting}
        onClick={onClick}
      >
        Send support request
      </Button>
      <div className="flex flex-col items-end gap-1">
        <div className="space-x-1 text-xs">
          <span className="text-foreground-light">We will contact you at</span>
          <span className="text-foreground font-medium">{userEmail}</span>
        </div>
        <span className="text-foreground-light text-xs">
          Please ensure emails from supabase.com are allowed
        </span>
      </div>
    </div>
  )
}
