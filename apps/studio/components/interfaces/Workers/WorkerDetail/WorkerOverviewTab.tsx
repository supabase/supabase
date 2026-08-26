import { ReactNode } from 'react'
import { Admonition } from 'ui-patterns/Admonition'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { WorkerCommandLine } from '../WorkerCommandLine'
import type { Worker } from '../Workers.types'
import { WorkerSnippetTabs } from '../WorkerSnippetTabs'
import { CLI_NAME } from '@/lib/constants/workers'

interface WorkerOverviewTabProps {
  worker: Worker
}

const InstanceCount = ({
  label,
  value,
  tooltip,
}: {
  label: string
  value: number
  tooltip: ReactNode
}) => (
  <div className="flex flex-col gap-1 px-5 py-4">
    <span className="flex items-center gap-1.5 text-sm text-foreground-light">
      {label}
      <InfoTooltip side="top" className="max-w-56">
        {tooltip}
      </InfoTooltip>
    </span>
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
          <div className="space-y-3">
            <p className="text-sm text-foreground-light">
              <span className="tabular-nums text-foreground">{worker.instances.ready}</span> of{' '}
              <span className="tabular-nums text-foreground">{worker.instances.declared}</span>{' '}
              instances ready
            </p>
            <div className="grid grid-cols-2 divide-x divide-y rounded-md border border-default bg-surface-100 sm:grid-cols-4 sm:divide-y-0">
              <InstanceCount
                label="Declared"
                value={worker.instances.declared}
                tooltip="Instances you configured for this worker."
              />
              <InstanceCount
                label="Live"
                value={worker.instances.live}
                tooltip="Instances currently running."
              />
              <InstanceCount
                label="Ready"
                value={worker.instances.ready}
                tooltip="Instances passing health checks and serving requests."
              />
              <InstanceCount
                label="Stale"
                value={worker.instances.stale}
                tooltip="Instances from a previous deployment, being replaced."
              />
            </div>
          </div>
        )}
      </PageSectionContent>
    </PageSection>

    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>How to call</PageSectionTitle>
          <PageSectionDescription>
            Call the worker over its gateway URL. Pass your project API key as a bearer token.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <WorkerSnippetTabs
          input={{
            name: worker.name,
            runtime: worker.runtime,
            size: worker.size,
            access: worker.access,
            instances: worker.declaredInstances,
          }}
          tabs={['curl', 'js', 'python']}
        />
      </PageSectionContent>
    </PageSection>
  </PageContainer>
)
