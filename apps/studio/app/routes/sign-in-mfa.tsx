import { MetaFunction } from '@remix-run/react'
import SignInMfaPage from 'pages/sign-in-mfa'

export const meta: MetaFunction = () => {
  return [{ title: 'Sign In MFA | Supabase' }]
}

export default SignInMfaPage
