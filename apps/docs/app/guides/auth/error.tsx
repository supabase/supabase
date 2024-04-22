'use client'

import { usePathname } from 'next/navigation'
import { GuideErrorTemplate } from '../GuideErrorTemplate'

const AuthErrorPage = () => {
  const pathname = usePathname()

  return <GuideErrorTemplate />
}

export default AuthErrorPage
