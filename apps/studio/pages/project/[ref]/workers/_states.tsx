import { useParams } from 'common'
import { Mermaid } from 'ui-patterns/Mermaid'

import {
  LIFECYCLE_STATE_CHART,
  LIFECYCLE_SWIMLANE_CHART,
  STATE_FIXTURES,
} from '@/components/interfaces/Workers/__fixtures__/states'
import { WORKER_STATE_META } from '@/components/interfaces/Workers/Workers.constants'
import { WorkerOverviewTab } from '@/components/interfaces/Workers/WorkerDetail/WorkerOverviewTab'
import { WorkerSettingsTab } from '@/components/interfaces/Workers/WorkerDetail/WorkerSettingsTab'
import { WorkerStatePill } from '@/components/interfaces/Workers/WorkerStatePill'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import WorkersLayout from '@/components/layouts/WorkersLayout/WorkersLayout'
import { IS_PLATFORM } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const SHOWCASE_REF = '_showcase'

const WorkerStatesShowcase: NextPageWithLayout = () => {
  const { ref } = useParams()
  const projectRef = (ref as string) ?? SHOWCASE_REF

  if (IS_PLATFORM) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-lg text-foreground">Worker states showcase</h1>
        <p className="mt-2 text-sm text-foreground-light">
          This is a dev-only design surface. Run Studio locally (non-platform) to render every
          lifecycle state and unhappy-path variant side by side.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-8">
      <header className="space-y-1">
        <h1 className="text-xl text-foreground">Worker states — design showcase</h1>
        <p className="text-sm text-foreground-light">
          Every lifecycle state and unhappy-path variant, rendered against fixture data. Never
          ships — gated on <code>!IS_PLATFORM</code>.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-wide text-foreground-lighter">Lifecycle</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-default p-4">
            <Mermaid chart={LIFECYCLE_STATE_CHART} />
          </div>
          <div className="rounded-md border border-default p-4">
            <Mermaid chart={LIFECYCLE_SWIMLANE_CHART} />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm uppercase tracking-wide text-foreground-lighter">
          Overview — every state
        </h2>
        {STATE_FIXTURES.map((worker) => (
          <div key={worker.id} className="space-y-3 rounded-md border border-default p-5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-foreground">{worker.name}</span>
              <WorkerStatePill state={worker.state} />
              <span className="text-xs text-foreground-lighter">
                {WORKER_STATE_META[worker.state].label}
                {worker.errorReason ? ` · ${worker.errorReason}` : ''}
              </span>
            </div>
            <WorkerOverviewTab projectRef={projectRef} worker={worker} />
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-sm uppercase tracking-wide text-foreground-lighter">
          Settings — sample
        </h2>
        <div className="rounded-md border border-default p-5">
          <WorkerSettingsTab worker={STATE_FIXTURES[1]} />
        </div>
      </section>
    </div>
  )
}

WorkerStatesShowcase.getLayout = (page) => (
  <DefaultLayout>
    <WorkersLayout title="States">{page}</WorkersLayout>
  </DefaultLayout>
)

export default WorkerStatesShowcase
