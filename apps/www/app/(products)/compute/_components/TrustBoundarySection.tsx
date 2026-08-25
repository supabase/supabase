import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { EyeOff, KeyRound, Network, Plug, ScanSearch, ShieldCheck } from 'lucide-react'

const features = [
  {
    title: 'Short-lived credentials',
    paragraph: 'Access runs through Supabase Auth with short-lived keys, not standing secrets.',
    icon: <KeyRound className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Zero-config data access',
    paragraph: 'Reach your database and Storage with the permissions your key already carries.',
    icon: <Plug className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Per-workload firewalls',
    paragraph: 'Define which external endpoints and ports each workload can reach.',
    icon: <Network className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Cloaked secrets',
    paragraph: 'Scope secrets per workload, and cloak values so your code never sees them.',
    icon: <EyeOff className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Patched automatically',
    paragraph: 'Kernel-level security patches roll out automatically. Nothing to do on your part.',
    icon: <ShieldCheck className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Dependency scanning',
    paragraph: 'Dependencies are scanned at runtime, with alerts as new vulnerabilities land.',
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
          Every sandbox and service inherits your project&apos;s auth, roles, and permissions the
          moment it starts. Agents get a sandbox that is already scoped to the data it is allowed to
          touch — nothing more.
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
