import Link from 'next/link'
import { Alert, Button } from 'ui'

export interface AlertErrorProps {
  ref?: string
  subject?: string
}

// [Joshen] To standardize the language for all error UIs

const AlertError = ({ ref, subject }: AlertErrorProps) => {
  const subjectString = subject?.replace(/ /g, '%20')
  let href = `/support/new?category=dashboard_bug`

  if (ref) href += `&ref=${ref}`
  if (subjectString) href += `&subject=${subjectString}`

  return (
    <Alert
      withIcon
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
      Try refreshing your browser, but if the issue persists, please reach out to us via support.
    </Alert>
  )
}

export default AlertError
