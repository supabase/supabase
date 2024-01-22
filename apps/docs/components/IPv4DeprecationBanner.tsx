import Link from 'next/link'
import { memo, useEffect, useReducer } from 'react'

import { Button, IconExternalLink, cn } from 'ui'

import { LOCAL_STORAGE_KEYS, retrieve, store } from '~/lib/storage'

const DISMISSAL_STORAGE_KEY = LOCAL_STORAGE_KEYS.IPV4_DEPRECATION_DISMISSAL

function changeBannerVsibility(_, isVisible: boolean) {
  if (isVisible) {
    return true
  }
  store('local', DISMISSAL_STORAGE_KEY, 'true')
  return false
}

export const IPv4DeprecationBanner = memo(() => {
  const [isBannerVisible, setIsBannerVisible] = useReducer(changeBannerVsibility, false)

  useEffect(() => {
    const acknowledged = retrieve('local', DISMISSAL_STORAGE_KEY) === 'true'
    if (!acknowledged) setIsBannerVisible(true)
  }, [])

  if (!isBannerVisible) return null

  return (
    <div className="flex items-center justify-center gap-x-4 bg-surface-100 p-3 transition text-foreground box-border border-b border-default">
      <p className="text-sm">
        Prepare for the pgBouncer and IPv4 deprecations on 26th January 2024{' '}
        <Link
          href="https://github.com/orgs/supabase/discussions/17817"
          target="_blank"
          rel="noreferrer"
          className={cn(
            'sm:hidden',
            'inline-flex items-center justify-center px-2.5 py-1',
            'border border-transparent rounded-md',
            'text-xs text-brand-600 hover:bg-brand-400',
            'ease-out duration-200 transition-all'
          )}
          aria-hidden="true"
        >
          Learn more
        </Link>
        <Button
          type="text"
          className="sm:hidden opacity-75"
          aria-hidden="true"
          onClick={() => setIsBannerVisible(false)}
        >
          Dismiss
        </Button>
      </p>
      <div className="max-sm:sr-only sm:flex items-center gap-x-1">
        <Button asChild type="link" iconRight={<IconExternalLink />}>
          <a
            href="https://github.com/orgs/supabase/discussions/17817"
            target="_blank"
            rel="noreferrer"
          >
            Learn more
          </a>
        </Button>
        <Button type="text" className="opacity-75" onClick={() => setIsBannerVisible(false)}>
          Dismiss
        </Button>
      </div>
    </div>
  )
})
IPv4DeprecationBanner.displayName = 'IPv4DeprecationBanner'
