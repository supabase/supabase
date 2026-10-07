import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import Link from 'next/link'

import { WaitlistForm } from './WaitlistForm'

export function CTASection() {
  return (
    <SectionContainerWithCn height="none">
      <div className="flex flex-col items-center text-center gap-10 py-24 md:py-32">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl md:text-4xl text-foreground">
            Run your next workload
            <span className="block text-foreground-lighter">next to your data</span>
          </h2>
          <p className="text-foreground-lighter text-sm max-w-md">
            Compute is in Private Alpha. Join the waitlist and we&apos;ll reach out as invites roll
            out.
          </p>
        </div>
        <WaitlistForm />
      </div>
    </SectionContainerWithCn>
  )
}
