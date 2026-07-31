import Layout from 'components/Layouts/Default'
import SectionContainer from 'components/Layouts/SectionContainer'
import SecurityNewsletterForm from 'components/SecurityNewsletterForm'
import PricingComparisonSection from 'components/Solutions/PricingComparisonSection'
import {
  Activity,
  Award,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  Globe,
  Key,
  Lock,
  RefreshCw,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { NextPage } from 'next'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from 'ui'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string
  label: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: 'certifications', label: 'Certifications' },
  { id: 'gdpr', label: 'GDPR' },
  { id: 'data-residency', label: 'Data residency' },
  { id: 'security-by-plan', label: 'By plan' },
  { id: 'shared-responsibility', label: 'Shared responsibility' },
  { id: 'network', label: 'Network' },
  { id: 'dpa', label: 'DPA' },
]

const CERTIFICATIONS = [
  {
    icon: <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />,
    title: 'SOC 2 Type 2',
    description:
      'Supabase is SOC 2 Type 2 compliant, confirming that our security controls have been independently audited over an extended observation period.',
    planNote: 'Report available to Team and Enterprise customers',
    planHref: '/dashboard/org/_/documents',
    imgSrc: '/images/security/soc2-type2.svg',
    docsHref: '/docs/guides/security/soc-2-compliance',
  },
  {
    icon: <Award className="w-5 h-5" strokeWidth={1.5} />,
    title: 'ISO 27001',
    description:
      'Supabase is ISO 27001 certified. ISO 27001 is the internationally recognized standard for information security management systems (ISMS).',
    planNote: 'Certificate available to Team and Enterprise customers',
    planHref: '/dashboard/org/_/documents',
  },
  {
    icon: <Activity className="w-5 h-5" strokeWidth={1.5} />,
    title: 'HIPAA',
    description:
      'Supabase is HIPAA compliant. You can store Protected Health Information (PHI) once you enter into a Business Associate Agreement (BAA) with us.',
    planNote: 'BAA available to Team and Enterprise customers',
    planHref: '/dashboard/org/_/documents',
    imgSrc: '/images/security/HIPAA.svg',
    docsHref:
      'https://supabase.com/docs/guides/deployment/shared-responsibility-model#managing-healthcare-data',
  },
]

const SECURITY_PLAN_ROWS = [
  { feature: 'AES-256 encryption at rest', values: [true, true, true, true] },
  { feature: 'TLS encryption in transit', values: [true, true, true, true] },
  { feature: 'Multi-factor authentication (MFA)', values: [true, true, true, true] },
  { feature: 'Role-based access control', values: [true, true, true, true] },
  { feature: 'Daily database backups', values: [false, true, true, true] },
  { feature: 'Point-in-Time Recovery (PITR)', values: [false, 'Add-on', true, true] },
  { feature: 'SOC 2 Type 2 report access', values: [false, false, true, true] },
  { feature: 'ISO 27001 certificate access', values: [false, false, true, true] },
  { feature: 'HIPAA BAA', values: [false, false, true, true] },
  { feature: 'IP allow-listing', values: [false, false, false, true] },
  { feature: 'SSO (SAML)', values: [false, false, false, true] },
  { feature: 'Audit logs', values: [false, false, false, true] },
  { feature: 'Custom Data Processing Agreement', values: [false, false, false, true] },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function SecurityStickyNav() {
  return (
    <div className="sticky top-[65px] z-30 w-full border-b border-default bg-background/90 backdrop-blur-xs">
      <SectionContainer className="py-0! overflow-x-auto">
        <nav className="flex items-center gap-1 min-w-max">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                'px-3 py-4 text-sm text-foreground-lighter border-b border-transparent',
                'hover:text-foreground transition-colors whitespace-nowrap',
                'focus-visible:outline-none focus-visible:text-foreground'
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </SectionContainer>
    </div>
  )
}

function CertificationCard({
  icon,
  title,
  description,
  planNote,
  planHref,
  imgSrc,
  docsHref,
}: (typeof CERTIFICATIONS)[number]) {
  return (
    <div className="flex flex-col gap-4 p-6 rounded-lg border border-default bg-surface-75">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-default bg-surface-100 text-foreground-light shadow-sm">
          {icon}
        </div>
        {imgSrc && <Image src={imgSrc} alt={title} width={64} height={32} className="h-8 w-auto" />}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="text-sm text-foreground-light leading-relaxed">{description}</p>
        {docsHref && (
          <Link
            href={docsHref}
            className="text-sm text-brand hover:text-brand-600 inline-flex items-center gap-1 mt-1"
          >
            Learn more <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {planNote && planHref && (
        <div className="mt-auto pt-3 border-t border-default">
          <Link
            href={planHref}
            className="text-xs text-foreground-muted hover:text-foreground-light inline-flex items-center gap-1 transition-colors"
          >
            <Lock className="w-3 h-3" />
            {planNote}
          </Link>
        </div>
      )}
    </div>
  )
}

function DraftBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-warning-300 bg-warning-200 px-2 py-0.5 text-xs font-medium text-warning-600">
      Draft — pending legal review
    </span>
  )
}

function DataResidencyTable() {
  const regions = ['US East (N. Virginia)', 'EU West (Ireland)', 'AP Southeast (Singapore)']
  const dataTypes = [
    { label: 'Postgres database', values: [true, true, true] },
    { label: 'Auth service data', values: [true, true, true] },
    { label: 'Storage objects', values: [true, true, true] },
    { label: 'Edge Functions', values: [true, true, true] },
    { label: 'Daily backups', values: [true, true, true] },
    { label: 'Realtime metadata', values: [true, true, true] },
    { label: 'Operational logs', values: ['TBC', 'TBC', 'TBC'] },
  ]

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-default bg-surface-75">
      <table className="w-full min-w-[600px] border-collapse text-left">
        <thead>
          <tr className="border-b border-default">
            <th className="py-4 px-4 md:px-6 text-sm font-normal text-foreground-light">
              Data type
            </th>
            {regions.map((r) => (
              <th
                key={r}
                className="py-4 px-4 md:px-6 text-sm font-medium text-center text-foreground"
              >
                {r}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataTypes.map((row) => (
            <tr
              key={row.label}
              className="border-b border-default last:border-b-0 hover:bg-surface-100/50 transition-colors"
            >
              <th className="py-3 px-4 md:px-6 text-sm font-normal text-foreground-light">
                {row.label}
              </th>
              {row.values.map((val, i) => (
                <td key={i} className="py-3 px-4 md:px-6 text-center">
                  <span className="flex items-center justify-center">
                    {val === true ? (
                      <span className="inline-flex items-center gap-1 text-xs text-brand">
                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        In-region
                      </span>
                    ) : (
                      <span className="text-xs text-foreground-muted">{val}</span>
                    )}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 md:px-6 py-3 text-xs text-foreground-muted border-t border-default">
        Illustrative — confirm with Supabase infrastructure team before citing in compliance
        documentation. Additional regions available; contact{' '}
        <Link href="/contact/enterprise" className="underline hover:text-foreground-light">
          Sales
        </Link>{' '}
        for a full list.
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SecurityPage: NextPage = () => {
  return (
    <>
      <NextSeo
        title="Security at Supabase"
        description="Supabase's security posture, certifications, GDPR compliance, data residency, and shared responsibility model — everything enterprise IT teams and CISOs need in one place."
        openGraph={{
          title: 'Security at Supabase',
          description:
            "Supabase's security posture, certifications, GDPR compliance, data residency, and shared responsibility model.",
          url: 'https://supabase.com/security',
        }}
      />

      <Layout>
        {/* Hero */}
        <SectionContainer className="grid grid-cols-12 items-center gap-8 py-16 md:py-24">
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
            <h1 className="text-3xl md:text-4xl xl:text-5xl font-medium text-foreground">
              Security at Supabase
            </h1>
            <p className="text-xl text-foreground-light max-w-xl leading-relaxed">
              The security posture, certifications, compliance documentation, and data residency
              information that enterprise IT teams, CISOs, and vendor reviewers need — in one place.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href="#dpa"
                className="inline-flex items-center gap-2 rounded-md border border-default bg-surface-75 px-4 py-2 text-sm text-foreground-light hover:bg-surface-100 hover:text-foreground transition-colors"
              >
                <FileText className="w-4 h-4" />
                Request a DPA
              </Link>
              <Link
                href="/contact/enterprise"
                className="inline-flex items-center gap-2 rounded-md border border-brand bg-brand/10 px-4 py-2 text-sm text-brand hover:bg-brand/20 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Talk to Sales
              </Link>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <Image
              src="/images/security/security-hero.png"
              alt="Supabase security"
              width={600}
              height={450}
              className="w-full"
            />
          </div>
        </SectionContainer>

        {/* Sticky nav */}
        <SecurityStickyNav />

        {/* Certifications */}
        <SectionContainer id="certifications" className="py-16 md:py-24 flex flex-col gap-8">
          <div className="flex flex-col gap-2 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-medium text-foreground">Certifications</h2>
            <p className="text-foreground-light">
              Supabase holds third-party certifications across security, healthcare, and privacy
              frameworks. Audit reports and certificates are available to qualifying customers
              directly from the dashboard.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CERTIFICATIONS.map((cert) => (
              <CertificationCard key={cert.title} {...cert} />
            ))}
          </div>
          {/* Additional feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {[
              {
                icon: <Key className="w-4 h-4" strokeWidth={1.5} />,
                title: 'Data Encryption',
                desc: 'AES-256 at rest, TLS in transit. Access tokens and keys are encrypted at the application layer before database storage.',
              },
              {
                icon: <Users className="w-4 h-4" strokeWidth={1.5} />,
                title: 'Role-based Access Control',
                desc: 'Fine-grained organization member permissions including Read-Only and Billing-Only roles.',
                href: '/docs/guides/platform/access-control',
              },
              {
                icon: <RefreshCw className="w-4 h-4" strokeWidth={1.5} />,
                title: 'Backups',
                desc: 'All paid projects are backed up daily. Point-in-Time Recovery is available as an add-on from Pro plan.',
              },
              {
                icon: <CreditCard className="w-4 h-4" strokeWidth={1.5} />,
                title: 'PCI-compliant Payments',
                desc: 'Supabase uses Stripe (PCI DSS Level 1) and does not store card information.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-2 p-5 rounded-lg border border-default bg-surface-75"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-default bg-surface-100 text-foreground-light">
                  {f.icon}
                </div>
                <h3 className="text-sm font-medium text-foreground">{f.title}</h3>
                <p className="text-xs text-foreground-light leading-relaxed">{f.desc}</p>
                {f.href && (
                  <Link
                    href={f.href}
                    className="text-xs text-brand hover:text-brand-600 inline-flex items-center gap-1 mt-auto"
                  >
                    Learn more <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </SectionContainer>

        {/* GDPR */}
        <div className="bg-surface-75 border-y border-default">
          <SectionContainer id="gdpr" className="py-16 md:py-24 flex flex-col gap-8">
            <div className="flex flex-col gap-3 max-w-xl">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-medium text-foreground">
                  GDPR & European compliance
                </h2>
                <DraftBadge />
              </div>
              <p className="text-foreground-light">
                Supabase is designed to support GDPR-compliant application development. If
                you&apos;re building for European enterprise clients, here&apos;s what we do on our
                end.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'EU data hosting',
                  desc: 'Projects can be hosted in EU regions (e.g., EU West — Ireland) so that Postgres data, Auth, and Storage remain in-region. See Data Residency below for a full breakdown by data type.',
                },
                {
                  title: 'Data Processing Agreement (DPA)',
                  desc: 'A DPA is available for customers who need a formal GDPR data processing contract. Enterprise customers can access the DPA directly from the dashboard; others can request it via the form below.',
                  href: '#dpa',
                  linkLabel: 'Request a DPA',
                },
                {
                  title: 'Sub-processor list',
                  desc: 'Supabase maintains a list of third-party sub-processors involved in processing customer data. This is required disclosure under GDPR Article 28.',
                  href: '/legal/privacy#subprocessors',
                  linkLabel: 'View sub-processors',
                },
                {
                  title: 'Right to erasure',
                  desc: 'When a Supabase project is deleted, all associated data is permanently removed from our systems. Customers are responsible for coordinating erasure requests for end-user data stored in their Postgres database.',
                },
                {
                  title: 'Data transfers',
                  desc: 'Supabase relies on Standard Contractual Clauses (SCCs) for any transfers of personal data outside the European Economic Area.',
                },
                {
                  title: 'Security by default',
                  desc: 'Postgres RLS, Auth JWT controls, and Storage policies give you the primitives to implement data minimization and purpose limitation at the application layer.',
                  href: '/docs/guides/database/postgres/row-level-security',
                  linkLabel: 'RLS documentation',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 p-5 rounded-lg border border-default bg-background"
                >
                  <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                  <p className="text-sm text-foreground-light leading-relaxed">{item.desc}</p>
                  {item.href && (
                    <Link
                      href={item.href}
                      className="text-xs text-brand hover:text-brand-600 inline-flex items-center gap-1 mt-1"
                    >
                      {item.linkLabel} <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-warning-300 bg-warning-100">
              <Shield className="w-4 h-4 text-warning-600 mt-0.5 shrink-0" />
              <p className="text-sm text-warning-700">
                This section represents Supabase&apos;s current practices and is intended to help
                developers provide accurate information to their clients&apos; IT teams. It does not
                constitute legal advice. Consult your legal counsel to confirm that Supabase meets
                your specific GDPR obligations.
              </p>
            </div>
          </SectionContainer>
        </div>

        {/* Data Residency */}
        <SectionContainer id="data-residency" className="py-16 md:py-24 flex flex-col gap-8">
          <div className="flex flex-col gap-3 max-w-xl">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-medium text-foreground">Data residency</h2>
              <DraftBadge />
            </div>
            <p className="text-foreground-light">
              When you create a Supabase project in an AWS region, your primary data is hosted in
              that region. The table below shows which data types remain in-region.
            </p>
          </div>
          <DataResidencyTable />
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 p-4 rounded-lg border border-default bg-surface-75 max-w-sm">
              <Globe className="w-5 h-5 text-foreground-light shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Available regions</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  US East, EU West, AP Southeast, and more.{' '}
                  <Link
                    href="/docs/guides/platform/regions"
                    className="text-brand hover:text-brand-600"
                  >
                    See all regions →
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-4 rounded-lg border border-default bg-surface-75 max-w-sm">
              <FileText className="w-5 h-5 text-foreground-light shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Need a formal attestation?</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Enterprise customers can request a data residency attestation letter.{' '}
                  <Link href="/contact/enterprise" className="text-brand hover:text-brand-600">
                    Contact Sales →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </SectionContainer>

        {/* Security by plan */}
        <div className="bg-surface-75 border-y border-default">
          <PricingComparisonSection
            id="security-by-plan"
            heading="Security features by plan"
            subheading="A clear summary of which security and compliance features are available at each tier."
            plans={[
              { name: 'Free' },
              { name: 'Pro' },
              { name: 'Team', highlight: true },
              { name: 'Enterprise' },
            ]}
            rows={SECURITY_PLAN_ROWS}
            cta={{ label: 'Compare all plans', url: '/pricing' }}
          />
        </div>

        {/* Shared responsibility */}
        <SectionContainer id="shared-responsibility" className="py-16 md:py-24 flex flex-col gap-4">
          <div className="flex flex-col gap-3 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-medium text-foreground">
              Shared responsibility model
            </h2>
            <p className="text-foreground-light">
              Supabase secures the infrastructure. You secure your application — RLS policies, API
              keys, and access controls.
            </p>
            <Link
              href="/docs/guides/deployment/shared-responsibility-model"
              className="text-sm text-brand hover:text-brand-600 inline-flex items-center gap-1"
            >
              Read the full shared responsibility model <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </SectionContainer>

        {/* Network protection */}
        <div className="bg-surface-75 border-y border-default">
          <SectionContainer id="network" className="py-16 md:py-24 flex flex-col gap-8">
            <div className="flex flex-col gap-2 max-w-xl">
              <h2 className="text-2xl md:text-3xl font-medium text-foreground">
                Network protection
              </h2>
              <p className="text-foreground-light">
                Supabase employs multiple layers of network-level protection across all hosted
                projects.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'DDoS mitigation',
                  desc: 'Supabase mitigates Distributed Denial of Service attacks at the CDN layer via Cloudflare and at the infrastructure layer, preventing resource abuse and protecting uptime.',
                },
                {
                  title: 'Rate limiting',
                  desc: 'Brute-force login attempts are blocked via fail2ban. Customers can customize rate limits for API routes and set spend caps to prevent runaway usage.',
                  href: '/docs/guides/deployment/going-into-prod#rate-limiting-resource-allocation--abuse-prevention',
                },
                {
                  title: 'Vulnerability management',
                  desc: 'Supabase conducts regular penetration tests with industry experts and uses GitHub, Vanta, and Snyk for continuous vulnerability scanning of our codebase and infrastructure.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 p-5 rounded-lg border border-default bg-background"
                >
                  <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                  <p className="text-sm text-foreground-light leading-relaxed">{item.desc}</p>
                  {item.href && (
                    <Link
                      href={item.href}
                      className="text-xs text-brand hover:text-brand-600 inline-flex items-center gap-1 mt-auto"
                    >
                      Learn more <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </SectionContainer>
        </div>

        {/* DPA & Legal */}
        <SectionContainer id="dpa" className="py-16 md:py-24 flex flex-col gap-4">
          <div className="flex flex-col gap-3 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-medium text-foreground">
              Data Processing Agreement
            </h2>
            <p className="text-foreground-light">
              A Data Processing Agreement (DPA) is available for customers who need a formal GDPR
              data processing contract.{' '}
              <Link href="/legal/dpa" className="text-brand hover:text-brand-600">
                View the DPA
              </Link>
              .
            </p>
            <p className="text-foreground-light">
              For sub-processor lists, security questionnaires, or custom legal agreements,{' '}
              <Link href="/contact/enterprise" className="text-brand hover:text-brand-600">
                contact Sales
              </Link>
              .
            </p>
          </div>
        </SectionContainer>

        {/* Newsletter */}
        <div className="bg-surface-75 border-t border-default">
          <SectionContainer className="py-16 md:py-24">
            <SecurityNewsletterForm />
          </SectionContainer>
        </div>
      </Layout>
    </>
  )
}

export default SecurityPage
