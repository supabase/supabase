import { InlineLink } from '@/components/ui/InlineLink'
import { SPECIAL_SYMBOLS_IN_PASSWORDS_DOCS_URL } from '@/lib/constants'

export const SpecialSymbolsCallout = () => {
  return (
    <p className="mb-2 text-warning">
      Note: If using the Postgres connection string, you will need to{' '}
      <InlineLink href={SPECIAL_SYMBOLS_IN_PASSWORDS_DOCS_URL}>percent-encode</InlineLink> the
      password
    </p>
  )
}
