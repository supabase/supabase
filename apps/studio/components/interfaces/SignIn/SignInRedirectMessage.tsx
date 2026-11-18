import { useQueryState } from 'nuqs'
import { Admonition } from 'ui-patterns/Admonition'

import { isSignInRedirectReason, SIGN_IN_REDIRECT_REASONS } from './SignIn.constants'

// Shown when the dashboard signs a user out and sends them back here, e.g. because their account
// can't be set up. Unknown reasons render nothing.
export const SignInRedirectMessage = () => {
  const [reason] = useQueryState('reason')
  if (!isSignInRedirectReason(reason)) return null

  const { title, description } = SIGN_IN_REDIRECT_REASONS[reason]
  return <Admonition type="warning" className="mb-4" title={title} description={description} />
}
