import { Check, Copy, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button, Card, CardContent, copyToClipboard } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import {
  LISTENING_PORT,
  WORKERS_REGION_LABEL,
  getRuntimeMeta,
  getSizeMeta,
} from '../Workers.constants'
import type { Worker } from '../Workers.types'
import { RuntimeBadge } from '../RuntimeBadge'
import { WorkerSnippetTabs } from '../WorkerSnippetTabs'
import { buildWorkerCliCommands } from '../workerSnippets'
import { WORKERS_DOCS_URL, WORKERS_SKILL_MARKDOWN } from '@/lib/constants/workers'
import { deleteWorker } from '@/state/workers-mock-state'

interface WorkerSettingsTabProps {
  projectRef: string
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

const CommandLine = ({ comment, command }: { comment: string; command: string }) => {
  const [isCopied, setIsCopied] = useState(false)
  const handleCopy = () => {
    setIsCopied(true)
    copyToClipboard(command)
    setTimeout(() => setIsCopied(false), 2000)
  }
  return (
    <div className="space-y-1">
      <p className="font-mono text-xs text-foreground-lighter">{`> ${comment}`}</p>
      <div className="flex items-center gap-2 font-mono text-sm text-foreground">
        <span className="text-foreground-lighter">$</span>
        <span className="flex-1">{command}</span>
        <button
          type="button"
          aria-label="Copy command"
          onClick={handleCopy}
          className="text-foreground-lighter transition-colors hover:text-foreground"
        >
          {isCopied ? <Check size={14} className="text-brand" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )
}

export const WorkerSettingsTab = ({ projectRef, worker }: WorkerSettingsTabProps) => {
  const router = useRouter()
  const runtime = getRuntimeMeta(worker.runtime)
  const size = getSizeMeta(worker.size)
  const commands = buildWorkerCliCommands(worker.name)

  const [showDelete, setShowDelete] = useState(false)
  const [isSkillCopied, setIsSkillCopied] = useState(false)

  const snippetInput = {
    name: worker.name,
    runtime: worker.runtime,
    size: worker.size,
    access: worker.access,
    instances: worker.instances,
  }

  const handleCopySkill = () => {
    setIsSkillCopied(true)
    copyToClipboard(WORKERS_SKILL_MARKDOWN)
    setTimeout(() => setIsSkillCopied(false), 2000)
  }

  const handleDelete = () => {
    deleteWorker(projectRef, worker.id)
    toast.success(`Worker "${worker.name}" deleted`)
    router.push(`/project/${projectRef}/workers`)
  }

  return (
    <>
      <PageHeader size="small" className="pb-8">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Settings</PageHeaderTitle>
            <PageHeaderDescription>
              Configuration is fixed at deploy time. Redeploy to change it.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="small">
        {/* Container */}
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
              <SettingsRow label="Base image">
                <span className="font-mono text-xs text-foreground-light">{runtime.baseImage}</span>
              </SettingsRow>
              <SettingsRow label="Entrypoint">
                <span className="font-mono text-xs text-foreground-light">{runtime.entrypoint}</span>
              </SettingsRow>
              <SettingsRow label="Listening port">
                <span className="font-mono text-xs text-foreground-light">
                  $PORT → {LISTENING_PORT}
                </span>
              </SettingsRow>
            </div>
          </PageSectionContent>
        </PageSection>

        {/* Resources */}
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Resources</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <div className="rounded-md border border-default bg-surface-100">
              <SettingsRow label="Size" isFirst>
                {size.label}
              </SettingsRow>
              <SettingsRow label="Instances">{worker.instances}</SettingsRow>
              <SettingsRow label="Access">
                {worker.access === 'public' ? (
                  <Badge variant="success">Public</Badge>
                ) : (
                  <Badge>Private</Badge>
                )}
              </SettingsRow>
              <SettingsRow label="Region">
                <span className="text-foreground-light">
                  {WORKERS_REGION_LABEL}{' '}
                  <span className="text-foreground-lighter">(locked)</span>
                </span>
              </SettingsRow>
            </div>
          </PageSectionContent>
        </PageSection>

        {/* Invoke worker */}
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

        {/* Develop locally */}
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
                <CommandLine
                  key={command.command}
                  comment={command.comment}
                  command={command.command}
                />
              ))}
            </div>
          </PageSectionContent>
        </PageSection>

        {/* Agents & skills */}
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
                  <Button
                    variant="default"
                    size="tiny"
                    icon={isSkillCopied ? <Check className="text-brand" /> : <Copy />}
                    onClick={handleCopySkill}
                  >
                    {isSkillCopied ? 'Copied' : 'Copy SKILL.md'}
                  </Button>
                  <Button asChild variant="text" size="tiny">
                    <Link href={WORKERS_DOCS_URL} target="_blank" rel="noreferrer">
                      View docs
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PageSectionContent>
        </PageSection>

        {/* Delete */}
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Delete worker</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Admonition
              type="destructive"
              title="Once your worker is deleted, it can no longer be restored"
              description="Deleting drains in-flight requests, then permanently removes the worker and its instances."
            >
              <div className="mt-3">
                <Button variant="danger" onClick={() => setShowDelete(true)}>
                  Delete worker
                </Button>
              </div>
            </Admonition>
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <ConfirmationModal
        visible={showDelete}
        variant="destructive"
        title={`Delete worker "${worker.name}"`}
        confirmLabel="Delete worker"
        confirmLabelLoading="Deleting"
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete}
        alert={{
          title: 'This action cannot be undone',
          description: 'The worker and all of its instances will be permanently removed.',
        }}
      />
    </>
  )
}
