import { MetaFunction } from '@remix-run/react'
import SignInPage from 'pages/sign-in'

export const meta: MetaFunction = () => {
  return [{ title: 'Sign In | Supabase' }]
}

export default SignInPage
