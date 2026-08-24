import { CTASection } from './CTASection'
import { DeploySection } from './DeploySection'
import { FAQSection } from './FAQSection'
import { Hero } from './Hero'
import { Highlights } from './Highlights'
import { PlatformSection } from './PlatformSection'
import { TrustBoundarySection } from './TrustBoundarySection'
import { WorkloadsSection } from './WorkloadsSection'

export function WorkersContent() {
  return (
    <div className="overflow-x-clip">
      <section className="border-t border-border" aria-label="Hero">
        <Hero />
        <Highlights />
      </section>
      <section id="workloads" className="border-t border-border" aria-label="Workload shapes">
        <WorkloadsSection />
      </section>
      <section id="security" className="border-t border-border" aria-label="Security model">
        <TrustBoundarySection />
      </section>
      <section id="deploy" className="border-t border-border" aria-label="Deployment options">
        <DeploySection />
      </section>
      <section id="platform" className="border-t border-border" aria-label="Platform features">
        <PlatformSection />
      </section>
      <section id="faq" className="border-t border-border" aria-label="Frequently asked questions">
        <FAQSection />
      </section>
      <section id="waitlist" className="border-t border-border" aria-label="Join the waitlist">
        <CTASection />
      </section>
    </div>
  )
}
