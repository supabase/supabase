'use client'

import Link from 'next/link'

/** ToS v4 / Enterprise Terms v4 effective date — matches the code freeze lift date. */
export const TOS_UPDATE_EFFECTIVE_DATE = '2026-10-05T00:00:00-07:00'
export const TOS_UPDATE_WWW_DISMISSAL_KEY = 'announcement_tos_update_v4'

export const TosUpdateBanner = () => (
  <div className="relative isolate flex min-h-14 w-full items-center justify-center overflow-hidden border-b border-muted bg-alternative px-4 py-2.5 pr-12 text-sm text-foreground sm:px-6 sm:pr-14">
    <p className="text-center leading-5">
      We&apos;ve updated our{' '}
      <Link
        href="/terms"
        className="underline decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-foreground"
      >
        Terms of Service
      </Link>
      . The new terms say which Supabase entity you contract with, add Supplemental Terms for
      certain features we may release or local law compliance, set new terms for alpha and beta
      features, and make accommodations for cloud marketplace transactions.
    </p>
  </div>
)
