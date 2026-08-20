import { Admonition } from 'ui-patterns/Admonition'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { WorkerCommandLine } from '../WorkerCommandLine'
import type { Worker } from '../Workers.types'
import { CLI_NAME } from '@/lib/constants/workers'

interface WorkerOverviewTabProps {
  worker: Worker
}

const InstanceCount = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col gap-1 px-5 py-4">
    <span className="text-sm text-foreground-light">{label}</span>
    <span className="text-2xl tabular-nums text-foreground">{value}</span>
  </div>
)

export const WorkerOverviewTab = ({ worker }: WorkerOverviewTabProps) => (
  <PageContainer size="small">
    {worker.buildState === 'failed' && (
      <PageSection>
        <PageSectionContent>
          <Admonition type="destructive" title="This worker failed to build">
            <div className="space-y-3">
              <p>{worker.stateReason ?? 'The build did not complete.'}</p>
              <WorkerCommandLine
                comment="Redeploy after fixing the build"
                command={`supabase ${CLI_NAME} push ${worker.name}`}
              />
            </div>
          </Admonition>
        </PageSectionContent>
      </PageSection>
    )}

    {worker.instancesError !== undefined && (
      <PageSection>
        <PageSectionContent>
          <Admonition type="warning" title="Instances reported an error">
            {worker.instancesError}
          </Admonition>
        </PageSectionContent>
      </PageSection>
    )}

    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Instances</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        {worker.instances === undefined ? (
          <p className="text-sm text-foreground-light">
            No instances are running for this worker yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-y rounded-md border border-default bg-surface-100 sm:grid-cols-4 sm:divide-y-0">
            <InstanceCount label="Declared" value={worker.instances.declared} />
            <InstanceCount label="Live" value={worker.instances.live} />
            <InstanceCount label="Ready" value={worker.instances.ready} />
            <InstanceCount label="Stale" value={worker.instances.stale} />
          </div>
        )}
      </PageSectionContent>
    </PageSection>

    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Logs and metrics</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <p className="text-sm text-foreground-light">
          Request metrics are not exposed by the Management API yet. Stream logs from the CLI.
        </p>
        <div className="mt-3">
          <WorkerCommandLine command={`supabase ${CLI_NAME} logs ${worker.name} --follow`} />
        </div>
      </PageSectionContent>
    </PageSection>
  </PageContainer>
)
