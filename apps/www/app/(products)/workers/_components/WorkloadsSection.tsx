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
      'Spin up short-lived, isolated environments to execute untrusted code — one per task, per session, or per agent. Connect over SSH, suspend when the work pauses, and resume with state intact in under a second.',
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
      'Run HTTP services written in Node, Python, Deno, or Rust — or anything that fits in a Dockerfile. Transcription pipelines, embedding jobs, agent frameworks, and APIs run as long as the work takes.',
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
      <div className="flex flex-col gap-4 max-w-xl">
        <span className="text-foreground-muted font-mono text-xs uppercase tracking-widest">
          Workloads
        </span>
        <h2 className="text-2xl md:text-4xl text-foreground">
          One runtime,
          <span className="text-foreground-lighter block">two shapes of work</span>
        </h2>
        <p className="text-foreground-lighter text-sm lg:text-base">
          Shipping an agentic product usually means one vendor for sandboxes, another for APIs, a
          third for jobs — and a database somewhere else. Every seam adds latency, credentials to
          manage, and a place to leak data. Workers collapses the stack into a single runtime inside
          your Supabase project.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {workloads.map((workload) => (
          <div
            key={workload.label}
            className="bg-surface-75 border border-border rounded-lg p-6 md:p-8 flex flex-col gap-4"
          >
            <span className="text-brand font-mono text-xs uppercase tracking-widest">
              {workload.label}
            </span>
            <h3 className="text-foreground text-xl">{workload.title}</h3>
            <p className="text-foreground-lighter text-sm">{workload.paragraph}</p>
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
