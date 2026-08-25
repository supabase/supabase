import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  Container,
  Infinity as InfinityIcon,
  Pause,
  Server,
  Shield,
  Terminal,
  TrendingUp,
} from 'lucide-react'

type WorkloadFeature = {
  icon: LucideIcon
  text: string
}

type Workload = {
  label: string
  title: string
  paragraph: string
  features: WorkloadFeature[]
}

const workloads: Workload[] = [
  {
    label: 'Sandboxes',
    title: 'Isolated environments for agent code',
    paragraph:
      'Execute untrusted code in a fresh environment — one per task, per session, or per agent.',
    features: [
      { icon: Shield, text: 'Per-session isolation for untrusted code' },
      { icon: Terminal, text: 'SSH access for humans and agents' },
      { icon: Pause, text: 'Suspend and resume with state preserved' },
      { icon: Bot, text: 'Provision programmatically via the API or MCP server' },
    ],
  },
  {
    label: 'Services',
    title: 'Always-on backends in any language',
    paragraph:
      'Transcription pipelines, embedding jobs, agent frameworks, and APIs — running as long as the work takes.',
    features: [
      { icon: InfinityIcon, text: 'No wall-clock limits on execution' },
      { icon: Container, text: 'Any runtime, static binary, or Dockerfile' },
      { icon: TrendingUp, text: 'Auto-scaling for traffic surges' },
      { icon: Server, text: 'HTTP services, background jobs, and long-running pipelines' },
    ],
  },
]

export function WorkloadsSection() {
  return (
    <SectionContainerWithCn spacing="sections">
      <div className="flex flex-col gap-4">
        <span className="text-foreground-muted font-mono text-xs uppercase tracking-widest">
          Workloads
        </span>
        <div className="flex flex-col md:grid grid-cols-2 items-end gap-2">
          <h2 className="text-2xl md:text-4xl text-foreground">
            One runtime,
            <span className="text-foreground-lighter block">two shapes of work</span>
          </h2>
          <p className="text-foreground-lighter text-sm lg:text-base text-pretty">
            Sandboxes, APIs, and background jobs usually mean three vendors and a database somewhere
            else. Compute runs them all inside your Supabase project.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {workloads.map((workload) => (
          <div
            key={workload.label}
            className="bg-surface-75 border border-border rounded-lg p-6 md:p-8 flex flex-col gap-4"
          >
            <span className="text-foreground-lighter font-mono text-xs uppercase tracking-widest">
              {workload.label}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-foreground text-2xl">{workload.title}</h3>
              <p className="text-foreground-lighter text-sm">{workload.paragraph}</p>
            </div>
            <ul className="flex flex-col gap-2 mt-2">
              {workload.features.map((feature) => {
                const Icon = feature.icon
                return (
                  <li
                    key={feature.text}
                    className="flex items-start gap-2 text-foreground-light text-sm"
                  >
                    <Icon
                      className="w-4 h-4 text-brand shrink-0 mt-0.5 stroke-[1.5px]"
                      aria-hidden
                    />
                    {feature.text}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </SectionContainerWithCn>
  )
}
