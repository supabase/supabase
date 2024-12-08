import Link from 'next/link'

import type { ResponseError } from 'types'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { WarningIcon } from 'ui'

export interface AlertErrorProps {
  projectRef?: string
  subject?: string
  error?: ResponseError | null
  className?: string
  showIcon?: boolean
}

// [Joshen] To standardize the language for all error UIs

const AlertError = ({
  projectRef,
  subject,
  error,
  className,
  showIcon = true,
}: AlertErrorProps) => {
  const subjectString = subject?.replace(/ /g, '%20')
  let href = `/support/new?category=dashboard_bug`

  if (projectRef) href += `&ref=${projectRef}`
  if (subjectString) href += `&subject=${subjectString}`
  if (error) href += `&message=Error:%20${error.message}`

  const formattedErrorMessage = error?.message?.includes('503')
    ? '503 Service Temporarily Unavailable'
    : error?.message

  return (
    <Alert_Shadcn_ className={className} variant="warning" title={subject}>
      {showIcon && <WarningIcon className="h-4 w-4" strokeWidth={2} />}
      <AlertTitle_Shadcn_>{subject}</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="flex flex-col gap-3 break-words">
        <div>
          {error?.message && <p className="text-left">Error: {formattedErrorMessage}</p>}
          <p className="text-left">
            Try refreshing your browser, but if the issue persists, please reach out to us via
            support.
          </p>
        </div>
        <div>
          <Button asChild type="warning">
            <Link href={href}>Contact support</Link>
          </Button>
        </div>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export default AlertError
