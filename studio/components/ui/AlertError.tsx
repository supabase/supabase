import Link from 'next/link'
import { ResponseError } from 'types'
import { Alert, Button } from 'ui'

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
    <Alert
      withIcon
      className={className}
      variant="warning"
      title={subject}
      actions={[
        <Link key="contact-support" href={href}>
          <a>
            <Button type="default" className="ml-4">
              Contact support
            </Button>
          </a>
        </Link>,
      ]}
    >
      {error && <p className="mb-1">Error: {error.message}</p>}
      <p>
        Try refreshing your browser, but if the issue persists, please reach out to us via support.
      </p>
    </Alert>
  )
}

export default AlertError
