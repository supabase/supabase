import { InlineLink } from 'components/ui/InlineLink'

export const SpecialSymbolsCallout = () => {
  return (
    <p className="mb-2">
      Note: If using a connection string, you will need to{' '}
      <InlineLink href="https://supabase.com/docs/guides/database/postgres/roles#special-symbols-in-passwords">
        percent-encode
      </InlineLink>{' '}
      the special symbols in the password
    </p>
  )
}
