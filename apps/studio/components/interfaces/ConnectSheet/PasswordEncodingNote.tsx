import { InlineLink } from '@/components/ui/InlineLink'
import { SPECIAL_SYMBOLS_IN_PASSWORDS_DOCS_URL } from '@/lib/constants'

export const PasswordEncodingNote = () => {
  return (
    <p className="text-sm text-foreground-lighter mb-1">
      If your database password contains special characters,{' '}
      <InlineLink href={SPECIAL_SYMBOLS_IN_PASSWORDS_DOCS_URL}>percent-encode</InlineLink> them in
      the connection string.
    </p>
  )
}
