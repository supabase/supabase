import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { Activity, GitBranch, Layers, Rocket, Sparkles, Zap } from 'lucide-react'

const features = [
  {
    title: 'Feels always-on',
    paragraph:
      'Workers suspend behind the scenes when idle on network I/O and resume in under a second — to your users, the service never went away.',
    icon: <Zap className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Safe releases',
    paragraph:
      'Progressive rollouts shift traffic gradually to new versions, and bad deploys roll back automatically.',
    icon: <Rocket className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Branching',
    paragraph:
      'Each branch runs its own Worker at its own URL against its own database state, so preview environments cover compute and data together.',
    icon: <GitBranch className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'Observability included',
    paragraph:
      'Execution logs, traces, audit logs, and usage metrics land in the same dashboard as the rest of your project. Failures surface with a root cause, in one place.',
    icon: <Activity className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'AI-assisted operations',
    paragraph:
      'The Supabase Assistant surfaces optimization and security insights for your Workers — and can act on them on your behalf.',
    icon: <Sparkles className="w-5 h-5 stroke-[1.4px]" />,
  },
  {
    title: 'A foundation, not a silo',
    paragraph:
      'Workers is the base for the next wave of Supabase products — Scheduled Tasks, Queues, and Workflows all build on the same runtime.',
    icon: <Layers className="w-5 h-5 stroke-[1.4px]" />,
  },
]

export function PlatformSection() {
  return (
    <SectionContainerWithCn spacing="sections">
      <div className="flex flex-col gap-4 max-w-xl">
        <span className="text-foreground-muted font-mono text-xs uppercase tracking-widest">
          Platform
        </span>
        <h2 className="text-2xl md:text-4xl text-foreground">
          Production-grade
          <span className="text-foreground-lighter block">from the first deploy</span>
        </h2>
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
