import { ReactNode } from 'react'
import { Badge } from 'ui'
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

import { COMPUTE_REGION_LABEL, LISTENING_PORT } from '../Compute.constants'
import type { ComputeInstance } from '../Compute.types'
import { formatSize, getRuntimeMeta } from '../Compute.utils'
import { ComputeInstanceCommandLine } from '../ComputeInstanceCommandLine'
import { buildComputeInstanceCliCommands } from '../computeInstanceSnippets'
import {
  COMPUTE_INSTANCE_CALL_TABS,
  ComputeInstanceSnippetTabs,
} from '../ComputeInstanceSnippetTabs'
import { RuntimeBadge } from '../RuntimeBadge'
import { CLI_NAME } from '@/lib/constants/compute'

interface ComputeInstanceOverviewTabProps {
  instance: ComputeInstance
}

const ComputeInstanceCount = ({
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

const SettingsRow = ({
  label,
  children,
  isFirst,
}: {
  label: string
  children: ReactNode
  isFirst?: boolean
}) => (
  <div
    className={`flex items-center justify-between px-4 py-3 ${
      isFirst ? '' : 'border-t border-default'
    }`}
  >
    <span className="text-sm text-foreground-light">{label}</span>
    <span className="text-sm text-foreground">{children}</span>
  </div>
)

export const ComputeInstanceOverviewTab = ({ instance }: ComputeInstanceOverviewTabProps) => {
  const runtime = getRuntimeMeta(instance.runtime)
  const commands = buildComputeInstanceCliCommands(instance.name)

  return (
    <PageContainer size="small">
      {instance.buildState === 'failed' && (
        <PageSection>
          <PageSectionContent>
            <Admonition type="destructive" title="This instance failed to build">
              <div className="space-y-3">
                <p>{instance.stateReason ?? 'The build did not complete.'}</p>
                <ComputeInstanceCommandLine
                  comment="Redeploy after fixing the build"
                  command={`supabase ${CLI_NAME} push ${instance.name}`}
                />
              </div>
            </Admonition>
          </PageSectionContent>
        </PageSection>
      )}

      {instance.instancesError !== undefined && (
        <PageSection>
          <PageSectionContent>
            <Admonition type="warning" title="Instances reported an error">
              {instance.instancesError}
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
          {instance.instances === undefined ? (
            <p className="text-sm text-foreground-light">
              No instances are running for this instance yet.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground-light">
                <span className="tabular-nums text-foreground">{instance.instances.ready}</span> of{' '}
                <span className="tabular-nums text-foreground">{instance.instances.declared}</span>{' '}
                instances ready
              </p>
              <div className="grid grid-cols-2 divide-x divide-y rounded-md border border-default bg-surface-100 sm:grid-cols-4 sm:divide-y-0">
                <ComputeInstanceCount
                  label="Instances"
                  value={instance.instances.declared}
                  tooltip="The number of instances you configured for this deployment."
                />
                <ComputeInstanceCount
                  label="Live"
                  value={instance.instances.live}
                  tooltip="Instances currently running."
                />
                <ComputeInstanceCount
                  label="Ready"
                  value={instance.instances.ready}
                  tooltip="Instances passing health checks and serving requests."
                />
                <ComputeInstanceCount
                  label="Stale"
                  value={instance.instances.stale}
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
            <PageSectionTitle>Container</PageSectionTitle>
            <PageSectionDescription>
              The runtime image and entrypoint resolved for this instance.
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <div className="rounded-md border border-default bg-surface-100">
            <SettingsRow label="Runtime" isFirst>
              <RuntimeBadge runtime={instance.runtime} />
            </SettingsRow>
            {instance.imageVersion !== undefined && (
              <SettingsRow label="Version">
                <span className="font-mono text-xs text-foreground-light">
                  {instance.imageVersion}
                </span>
              </SettingsRow>
            )}
            {runtime !== undefined && (
              <SettingsRow label="Base image">
                <span className="font-mono text-xs text-foreground-light">{runtime.baseImage}</span>
              </SettingsRow>
            )}
            {runtime !== undefined && (
              <SettingsRow label="Entrypoint">
                <span className="font-mono text-xs text-foreground-light">
                  {runtime.entrypoint}
                </span>
              </SettingsRow>
            )}
            <SettingsRow label="Listening port">
              <span className="font-mono text-xs text-foreground-light">
                $PORT → {LISTENING_PORT}
              </span>
            </SettingsRow>
          </div>
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Resources</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <div className="rounded-md border border-default bg-surface-100">
            <SettingsRow label="Size" isFirst>
              {formatSize(instance.size)}
            </SettingsRow>
            <SettingsRow label="Instances">{instance.declaredInstances}</SettingsRow>
            <SettingsRow label="Access">
              {instance.access === 'public' ? (
                <Badge variant="success">Public</Badge>
              ) : (
                <Badge>Private</Badge>
              )}
            </SettingsRow>
            <SettingsRow label="Region">
              <span className="text-foreground-light">
                {COMPUTE_REGION_LABEL} <span className="text-foreground-lighter">(locked)</span>
              </span>
            </SettingsRow>
          </div>
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>How to call</PageSectionTitle>
            <PageSectionDescription>Call the instance over its gateway URL.</PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <ComputeInstanceSnippetTabs
            input={{
              name: instance.name,
              runtime: instance.runtime,
              size: instance.size,
              access: instance.access,
              instances: instance.declaredInstances,
            }}
            tabs={COMPUTE_INSTANCE_CALL_TABS}
          />
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Develop locally</PageSectionTitle>
            <PageSectionDescription>
              Manage this instance from the Supabase CLI.
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <div className="space-y-4 rounded-md border border-default bg-surface-100 p-4">
            {commands.map((command) => (
              <ComputeInstanceCommandLine
                key={command.command}
                comment={command.comment}
                command={command.command}
              />
            ))}
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
