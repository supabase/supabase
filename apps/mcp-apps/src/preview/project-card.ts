/**
 * Project and branch card fixtures for `?preview=` URLs: a tool call that
 * plays out without a host, so every state of the card can be seen.
 *
 *   starting         arguments, then the result, then each step until Active
 *   active           already Active; connection details can be opened
 *   loading          waiting on the tool (or on the user to confirm it)
 *   failed           setup fails after the first check
 *   tool-error       the tool call itself returned an error
 *   cancelled        the call was cancelled
 *   check-failed     status checks fail; Retry recovers
 *   no-tools         the host can't proxy tool calls or open links
 */
import type { Branch, Project } from 'surfaces/contract'

import type { ToolCallSession } from '../host/connect'
import { createToolCallStore, type ToolCallSnapshot } from '../host/tool-call-store'
import type { BranchCardData } from '../shell/BranchCardScreen'
import type { ProjectCardData } from '../shell/ProjectCardScreen'

const POLL_INTERVAL_MS = 2000
const RESULT_AFTER_MS = 1500

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const organization = { id: 'acme', name: 'Acme Inc', slug: 'acme' }

const project: Project = {
  id: 'surfaces-preview-fixture',
  ref: 'wkqjzhxrtpmvbnslcdfa',
  name: 'Support inbox',
  status: 'COMING_UP',
  region: 'us-east-1',
  organization_id: 'org-1',
  organization_slug: 'acme',
}

const parent: Project = { ...project, name: 'Acme production', status: 'ACTIVE_HEALTHY' }

const branch: Branch = {
  id: 'surfaces-preview-fixture-branch',
  name: 'develop',
  project_ref: 'qhzmpxvbtrwkcnsldjfa',
  parent_project_ref: project.ref!,
  status: 'CREATING_PROJECT',
}

/** A tool call that plays `script` out: each step changes the snapshot after its delay. */
function playToolCall<T>(
  initial: Partial<ToolCallSnapshot<T>>,
  script: { after: number; change: Partial<ToolCallSnapshot<T>> }[] = []
) {
  const { store, update } = createToolCallStore<T>({
    isConnected: true,
    canCallTools: true,
    canOpenLinks: true,
    ...initial,
  })
  let delay = 0
  for (const { after, change } of script) {
    delay += after
    setTimeout(() => update(change), delay)
  }
  return store
}

/** Reads that return each status in turn, then the last one from then on. */
function sequence<T extends { status: string }>(created: T, statuses: string[]) {
  let reads = 0
  return async () => {
    await wait(150)
    const status = statuses[Math.min(reads, statuses.length - 1)]
    reads += 1
    return { ...created, status }
  }
}

/** Reads that fail until Retry has been pressed: the first three are the checks giving up. */
function failingThenActive<T extends { status: string }>(created: T, active: string) {
  let reads = 0
  return async () => {
    await wait(150)
    reads += 1
    if (reads <= 3) throw new Error('Service temporarily unavailable')
    return { ...created, status: active }
  }
}

const agent = {
  agentName: 'agent',
  isPreview: true,
  openLink: (url: string) => void window.open(url, '_blank', 'noopener'),
}

const connection = {
  async getProjectUrl({ project_id }: { project_id: string }) {
    await wait(600)
    return { url: `https://${project_id}.supabase.co` }
  },
  async getPublishableKeys() {
    return {
      keys: [{ api_key: 'sb_publishable_preview_fixture', name: 'default', type: 'publishable' }],
    }
  },
}

export async function previewProjectCard(name: string): Promise<ToolCallSession<Project>> {
  const input = { name: project.name, region: project.region, organization_id: 'acme' }
  const ready = (status = project.status) =>
    ({ call: { status: 'ready', data: { ...project, status } } }) as const
  const arrives = [{ after: RESULT_AFTER_MS, change: ready() }]

  let toolCall = playToolCall<Project>({ input }, arrives)
  let getProject = sequence(project, [
    'COMING_UP',
    'COMING_UP',
    'ACTIVE_UNHEALTHY',
    'ACTIVE_HEALTHY',
  ])
  if (name === 'active') {
    toolCall = playToolCall({ input, ...ready('ACTIVE_HEALTHY') })
    getProject = sequence(project, ['ACTIVE_HEALTHY'])
  } else if (name === 'loading') {
    toolCall = playToolCall({ input })
  } else if (name === 'failed') {
    getProject = sequence(project, ['COMING_UP', 'INIT_FAILED'])
  } else if (name === 'tool-error') {
    toolCall = playToolCall({ input }, [
      {
        after: RESULT_AFTER_MS,
        change: {
          call: {
            status: 'error',
            message: 'The organization has reached its limit of free projects.',
          },
        },
      },
    ])
  } else if (name === 'cancelled') {
    toolCall = playToolCall({ input }, [
      { after: RESULT_AFTER_MS, change: { call: { status: 'cancelled' } } },
    ])
  } else if (name === 'check-failed') {
    getProject = failingThenActive(project, 'ACTIVE_HEALTHY')
  } else if (name === 'no-tools') {
    toolCall = playToolCall({ input, canCallTools: false, canOpenLinks: false }, arrives)
  }

  const data: ProjectCardData = {
    getProject,
    getOrganization: async () => organization,
    ...connection,
  }
  return {
    toolCall,
    agent,
    pollIntervalMs: POLL_INTERVAL_MS,
    data: data as ToolCallSession<Project>['data'],
  }
}

export async function previewBranchCard(name: string): Promise<ToolCallSession<Branch>> {
  const input = { name: branch.name, project_id: branch.parent_project_ref }
  const ready = (status = branch.status) =>
    ({ call: { status: 'ready', data: { ...branch, status } } }) as const
  const arrives = [{ after: RESULT_AFTER_MS, change: ready() }]

  let toolCall = playToolCall<Branch>({ input }, arrives)
  let readBranch = sequence(branch, [
    'CREATING_PROJECT',
    'RUNNING_MIGRATIONS',
    'MIGRATIONS_PASSED',
    'FUNCTIONS_DEPLOYED',
  ])
  if (name === 'active') {
    toolCall = playToolCall({ input, ...ready('FUNCTIONS_DEPLOYED') })
    readBranch = sequence(branch, ['FUNCTIONS_DEPLOYED'])
  } else if (name === 'loading') {
    toolCall = playToolCall({ input })
  } else if (name === 'failed') {
    readBranch = sequence(branch, ['CREATING_PROJECT', 'RUNNING_MIGRATIONS', 'MIGRATIONS_FAILED'])
  }

  const data: BranchCardData = {
    listBranches: async () => ({ branches: [await readBranch()] }),
    getProject: async () => parent,
    getOrganization: async () => organization,
    ...connection,
  }
  return {
    toolCall,
    agent,
    pollIntervalMs: POLL_INTERVAL_MS,
    data: data as ToolCallSession<Branch>['data'],
  }
}
