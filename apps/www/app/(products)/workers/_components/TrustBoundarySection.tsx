import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { EyeOff, KeyRound, Network, Plug, ScanSearch, ShieldCheck } from 'lucide-react'

const features = [
  {
    title: 'Short-lived credentials',
    paragraph:
      'Access to Workers is controlled through Supabase Auth, with short-lived keys instead of long-lived secrets that are hard to revoke.',
    icon: <KeyRound className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Zero-config data access',
    paragraph:
      'Workers reach your database and Storage with the permissions carried by their key — no connection strings to wire up. The Server SDK removes the boilerplate.',
    icon: <Plug className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Per-worker firewalls',
    paragraph:
      'Define exactly which external services and ports each Worker can reach. Untrusted code stays inside the boundary you set.',
    icon: <Network className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Cloaked secrets',
    paragraph:
      'Scope secrets to individual Workers. Optionally cloak values at runtime: Supabase injects them only on requests to approved services, so your code — and your agents — never see them.',
    icon: <EyeOff className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Patched automatically',
    paragraph:
      'Kernel-level security patches roll out to every Worker runtime automatically, with no action on your part.',
    icon: <ShieldCheck className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Dependency scanning',
    paragraph:
      'Dependencies are scanned at runtime and you are alerted as new vulnerabilities are disclosed — including packages flagged after you shipped.',
    icon: <ScanSearch className="w-5 h-5 stroke-[1.4px]" />,
  },
]

export function TrustBoundarySection() {
  return (
    <SectionContainerWithCn spacing="sections">
      <div className="flex flex-col gap-4 max-w-xl">
        <span className="text-foreground-muted font-mono text-xs uppercase tracking-widest">
          Security
        </span>
        <h2 className="text-2xl md:text-4xl text-foreground">
          One trust boundary,
          <span className="text-foreground-lighter block">preconfigured</span>
        </h2>
        <p className="text-foreground-lighter text-sm lg:text-base">
          A Worker inherits your project&apos;s auth, roles, and permissions the moment it starts.
          Agents get a sandbox that is already scoped to the data it is allowed to touch — nothing
          more.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-surface-75 border border-border rounded-lg p-6 flex flex-col gap-3"
          >
            <div className="text-foreground-lighter" aria-hidden>
              {feature.icon}
            </div>
            <h3 className="text-foreground text-base font-medium">{feature.title}</h3>
            <p className="text-foreground-lighter text-sm">{feature.paragraph}</p>
          </div>
        ))}
      </div>
    </SectionContainerWithCn>
  )
}
