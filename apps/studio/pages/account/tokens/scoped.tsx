import { useRouter } from 'next/router'
import { useEffect } from 'react'

import type { NextPageWithLayout } from '@/types'

const ScopedTokens: NextPageWithLayout = () => {
  const router = useRouter()
  useEffect(() => {
    router.replace('/account/tokens')
  }, [router])
}

export default ScopedTokens
