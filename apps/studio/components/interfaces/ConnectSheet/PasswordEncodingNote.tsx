import { Admonition } from 'ui-patterns/admonition'

import { InlineLink } from '@/components/ui/InlineLink'
import { SPECIAL_SYMBOLS_IN_PASSWORDS_DOCS_URL } from '@/lib/constants'

export const PasswordEncodingNote = () => {
  return (
    <Admonition
      type="default"
      description={
        <>
          If your database password contains special characters, you will need to{' '}
          <InlineLink href={SPECIAL_SYMBOLS_IN_PASSWORDS_DOCS_URL}>percent-encode</InlineLink> them
          in the connection string.
        </>
      }
    />
  )
}
