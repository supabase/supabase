import { useRouter } from 'next/router'
import { useEffect } from 'react'

import type { NextPageWithLayout } from '@/types'

/**
 * The Classic/Scoped tabs were merged into a single Tokens list at /account/tokens. This route is
 * kept as a redirect so existing links and bookmarks continue to work.
 */
const ScopedTokensRedirect: NextPageWithLayout = () => {
  const router = useRouter()

  useEffect(() => {
    router.replace('/account/tokens')
  }, [router])

  return null
}

export default ScopedTokensRedirect
