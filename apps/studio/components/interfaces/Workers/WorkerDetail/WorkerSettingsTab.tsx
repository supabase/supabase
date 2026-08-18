import { Sparkles } from 'lucide-react'
import { ReactNode } from 'react'
import { Badge, Card, CardContent } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { RuntimeBadge } from '../RuntimeBadge'
import { WorkerCommandLine } from '../WorkerCommandLine'
import { LISTENING_PORT, WORKERS_REGION_LABEL } from '../Workers.constants'
import type { Worker } from '../Workers.types'
import { formatSize, getRuntimeMeta } from '../Workers.utils'
import { buildWorkerCliCommands } from '../workerSnippets'
import { WorkerSnippetTabs } from '../WorkerSnippetTabs'
import CopyButton from '@/components/ui/CopyButton'
import { WORKERS_SKILL_MARKDOWN } from '@/lib/constants/workers'

interface WorkerSettingsTabProps {
  worker: Worker
}

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

export const WorkerSettingsTab = ({ worker }: WorkerSettingsTabProps) => {
  const runtime = getRuntimeMeta(worker.runtime)
  const commands = buildWorkerCliCommands(worker.name)

  const snippetInput = {
    name: worker.name,
    runtime: worker.runtime,
    size: worker.size,
    access: worker.access,
    instances: worker.declaredInstances,
  }

  return (
    <>
      <PageContainer size="small">
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Container</PageSectionTitle>
              <PageSectionDescription>
                The runtime image and entrypoint resolved for this worker.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <div className="rounded-md border border-default bg-surface-100">
              <SettingsRow label="Runtime" isFirst>
                <RuntimeBadge runtime={worker.runtime} />
              </SettingsRow>
              {worker.imageVersion !== undefined && (
                <SettingsRow label="Image version">
                  <span className="font-mono text-xs text-foreground-light">
                    {worker.imageVersion}
                  </span>
                </SettingsRow>
              )}
              {runtime !== undefined && (
                <SettingsRow label="Base image">
                  <span className="font-mono text-xs text-foreground-light">
                    {runtime.baseImage}
                  </span>
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
                {formatSize(worker.size)}
              </SettingsRow>
              <SettingsRow label="Instances">{worker.declaredInstances}</SettingsRow>
              <SettingsRow label="Access">
                {worker.access === 'public' ? (
                  <Badge variant="success">Public</Badge>
                ) : (
                  <Badge>Private</Badge>
                )}
              </SettingsRow>
              <SettingsRow label="Region">
                <span className="text-foreground-light">
                  {WORKERS_REGION_LABEL} <span className="text-foreground-lighter">(locked)</span>
                </span>
              </SettingsRow>
            </div>
          </PageSectionContent>
        </PageSection>

        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Invoke worker</PageSectionTitle>
              <PageSectionDescription>
                Call the worker over its gateway URL. Pass your project API key as a bearer token.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <WorkerSnippetTabs input={snippetInput} tabs={['curl', 'js', 'python']} />
          </PageSectionContent>
        </PageSection>

        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Develop locally</PageSectionTitle>
              <PageSectionDescription>
                Manage this worker from the Supabase CLI.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <div className="space-y-4 rounded-md border border-default bg-surface-100 p-4">
              {commands.map((command) => (
                <WorkerCommandLine
                  key={command.command}
                  comment={command.comment}
                  command={command.command}
                />
              ))}
            </div>
          </PageSectionContent>
        </PageSection>

        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Agents &amp; skills</PageSectionTitle>
              <PageSectionDescription>
                Hand a skill file to your agent so it can invoke, redeploy, and manage this worker.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Card>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-foreground-light" />
                  <span className="text-sm text-foreground">SKILL.md</span>
                  <Badge variant="default">For agents</Badge>
                </div>
                <p className="text-sm text-foreground-light">
                  Drop this skill into Claude Code or any agent to let it deploy and manage workers
                  from natural language.
                </p>
                <div className="flex items-center gap-3">
                  <CopyButton text={WORKERS_SKILL_MARKDOWN} variant="default" size="tiny">
                    Copy SKILL.md
                  </CopyButton>
                </div>
              </CardContent>
            </Card>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
