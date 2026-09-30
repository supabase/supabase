import { InlineLink } from '@/components/ui/InlineLink'
import { SPECIAL_SYMBOLS_IN_PASSWORDS_DOCS_URL } from '@/lib/constants'

export const PasswordEncodingNote = () => {
  return (
    <p className="text-sm text-foreground-lighter mb-1">
      Replace [YOUR-PASSWORD], including the brackets, with your database password.{' '}
      <InlineLink href={SPECIAL_SYMBOLS_IN_PASSWORDS_DOCS_URL}>Percent-encode</InlineLink> any
      special characters in the connection string.
    </p>
  )
}
