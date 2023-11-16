import Link from 'next/link'
import { ResponseError } from 'types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
} from 'ui'

export interface AlertErrorProps {
  ref?: string
  subject?: string
  error?: ResponseError | null
  className?: string
}

// [Joshen] To standardize the language for all error UIs

const AlertError = ({ ref, subject, error, className }: AlertErrorProps) => {
  const subjectString = subject?.replace(/ /g, '%20')
  let href = `/support/new?category=dashboard_bug`

  if (ref) href += `&ref=${ref}`
  if (subjectString) href += `&subject=${subjectString}`
  if (error) href += `&message=Error:%20${error.message}`

  return (
    <Alert_Shadcn_ className={className} variant="warning" title={subject}>
      <IconAlertCircle className="h-4 w-4" color="bg-warning-300" strokeWidth={2} />
      <AlertTitle_Shadcn_>{subject}</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="flex flex-col gap-3">
        <div>
          {error?.message && <p>Error: {error?.message}</p>}
          <p>
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
