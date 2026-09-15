'use client'

import Link from 'next/link'

import { PRIVACY_POLICY_CONTACT_EMAIL, PRIVACY_POLICY_URL } from './PrivacyPolicyPromotion'

export const PrivacyPolicyBanner = () => (
  <div className="relative flex w-full items-center justify-center border-b border-muted bg-alternative px-4 py-2.5 pr-12 sm:px-6 sm:pr-14">
    <p className="max-w-4xl text-center text-sm leading-5 text-foreground-light sm:text-left">
      <span className="font-medium text-foreground">Privacy Policy Update:</span> We've updated our
      Privacy Policy to align with our Data Processing Addendum. The data controller is now listed
      as <span className="font-medium text-foreground">Supabase Pte. Ltd.</span> (previously
      Supabase, Inc.). This is an organizational change for clarity—your rights, our obligations,
      and your data protections remain unchanged. Read the updated{' '}
      <Link href={PRIVACY_POLICY_URL} className="text-foreground hover:underline">
        Privacy Policy
      </Link>{' '}
      or{' '}
      <a
        href={`mailto:${PRIVACY_POLICY_CONTACT_EMAIL}`}
        className="text-foreground hover:underline"
      >
        contact us
      </a>{' '}
      with any questions.
    </p>
  </div>
)
