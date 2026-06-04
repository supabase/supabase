import { Suspense } from 'react'

import BackgroundPattern from './BackgroundPattern'
import PartnerIntakeForm from './PartnerIntakeForm'
import SectionContainer from '@/components/Layouts/SectionContainer'
import SectionHeading from '@/components/Layouts/SectionHeading'

export default function BecomeAPartner() {
  return (
    <div className="relative overflow-hidden border-y bg-alternative">
      <BackgroundPattern />
      <SectionContainer
        id="become-a-partner"
        className="relative mx-auto max-w-3xl flex flex-col gap-10 py-24 px-6 md:py-32"
      >
        <SectionHeading
          align="center"
          title={
            <>
              Apply to become a <span className="text-brand-link block">Supabase partner</span>
            </>
          }
          description="Tell us about your company, what you’re building and the program you're interested in.
            We review every application and follow up within a week."
        />
        <Suspense>
          <PartnerIntakeForm />
        </Suspense>
      </SectionContainer>
    </div>
  )
}
