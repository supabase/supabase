interface JwtVerificationStateParams {
  /** Whether the legacy JWT gate can be satisfied at all — see `useIsJwtVerificationAvailable`. */
  isAvailable: boolean
  /**
   * The function's *saved* `verify_jwt` value. Deliberately not the form value: a function already
   * deployed with the gate on has to stay toggleable so the user can turn it back off, and reading
   * the form value would disable the switch the moment they did.
   */
  isEnforced: boolean
}

interface JwtVerificationState {
  /** Whether `verify_jwt` can be changed on this deployment, permissions aside. */
  canToggle: boolean
  /** Whether the function currently rejects every request because the gate can never be passed. */
  isUnsatisfiable: boolean
}

/**
 * Resolves how a function's `verify_jwt` setting should be presented.
 *
 * Where legacy JWT keys are turned off the gate can never be satisfied, so it must not be possible
 * to turn on — but a function already saved with it on stays toggleable, because turning it off is
 * the only way out of that state.
 */
export const getJwtVerificationState = ({
  isAvailable,
  isEnforced,
}: JwtVerificationStateParams): JwtVerificationState => ({
  canToggle: isAvailable || isEnforced,
  isUnsatisfiable: isEnforced && !isAvailable,
})
