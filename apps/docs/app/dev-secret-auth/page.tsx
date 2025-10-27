import { notFound } from 'next/navigation'

import { DevSecretAuthForm } from './AuthForm.client'

export default async function DevOnlySecretAuth() {
  if (process.env.NEXT_PUBLIC_DEV_AUTH_PAGE !== 'true') {
    throw notFound()
  }

  return <DevSecretAuthForm />
}
