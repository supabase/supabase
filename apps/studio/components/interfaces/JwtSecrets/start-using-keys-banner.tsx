// [console fork] Self-host uses the legacy symmetric JWT secret; the asymmetric
// signing-keys migration isn't supported by the bundled GoTrue, so we hide the
// "Start using JWT signing keys / Migrate JWT secret" prompt entirely.
export const StartUsingJwtSigningKeysBanner = (_props: {
  onClick: () => void
  isLoading: boolean
}) => null
