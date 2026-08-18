import { WORKERS_REGION } from '../Workers.constants'
import type { Worker } from '../Workers.types'

/**
 * Static fixture workers — one per lifecycle state + error reason — for the
 * dev-only `/workers/_states` showcase. Plain literals, no store mutation, so
 * design can see every detail-page variant side by side.
 */

const AT = '2026-08-10T09:00:00.000Z'
const AT_LATER = '2026-08-10T09:03:00.000Z'

const base = {
  runtime: 'python',
  size: '4x2',
  access: 'public',
  instances: 2,
  region: WORKERS_REGION,
  createdAt: AT,
  updatedAt: AT_LATER,
} satisfies Omit<Worker, 'id' | 'name' | 'state' | 'events' | 'errorReason'>

export const STATE_FIXTURES: Worker[] = [
  {
    ...base,
    id: 'fx-deploying',
    name: 'fx-deploying',
    state: 'deploying',
    events: [{ id: 'fx-deploying-1', at: AT, level: 'info', message: 'Deploy started' }],
  },
  {
    ...base,
    id: 'fx-active',
    name: 'fx-active',
    state: 'active',
    events: [
      { id: 'fx-active-1', at: AT, level: 'info', message: 'Deploy started' },
      { id: 'fx-active-2', at: AT_LATER, level: 'info', message: 'Worker active on 2 instances' },
    ],
  },
  {
    ...base,
    id: 'fx-errored-crash',
    name: 'fx-errored-crash',
    state: 'errored',
    errorReason: 'crash',
    events: [
      {
        id: 'fx-errored-crash-1',
        at: AT_LATER,
        level: 'error',
        reason: 'crash',
        message: 'Worker exited with a non-zero status',
      },
    ],
  },
  {
    ...base,
    id: 'fx-errored-unresponsive',
    name: 'fx-errored-unresponsive',
    state: 'errored',
    errorReason: 'unresponsive',
    events: [
      {
        id: 'fx-errored-unresponsive-1',
        at: AT_LATER,
        level: 'error',
        reason: 'unresponsive',
        message: 'Health check failed — worker did not respond on $PORT',
      },
    ],
  },
  {
    ...base,
    id: 'fx-errored-build',
    name: 'fx-errored-build',
    state: 'errored',
    errorReason: 'build',
    events: [
      {
        id: 'fx-errored-build-1',
        at: AT_LATER,
        level: 'error',
        reason: 'build',
        message: 'Build failed',
      },
    ],
  },
  {
    ...base,
    id: 'fx-suspended',
    name: 'fx-suspended',
    state: 'suspended',
    events: [
      {
        id: 'fx-suspended-1',
        at: AT_LATER,
        level: 'info',
        message: 'Suspended after idle timeout',
      },
    ],
  },
  {
    ...base,
    id: 'fx-resuming',
    name: 'fx-resuming',
    state: 'resuming',
    events: [{ id: 'fx-resuming-1', at: AT_LATER, level: 'info', message: 'Resuming worker' }],
  },
  {
    ...base,
    id: 'fx-draining',
    name: 'fx-draining',
    state: 'draining',
    events: [{ id: 'fx-draining-1', at: AT_LATER, level: 'info', message: 'Draining connections' }],
  },
  {
    ...base,
    id: 'fx-killed',
    name: 'fx-killed',
    state: 'killed',
    events: [
      { id: 'fx-killed-1', at: AT_LATER, level: 'info', message: 'Worker killed after delete' },
    ],
  },
]

export const LIFECYCLE_STATE_CHART = `stateDiagram-v2
    [*] --> deploying
    deploying --> active     : build ok
    deploying --> errored    : build fail / entrypoint / deps
    active    --> draining   : idle timeout | suspend | delete
    active    --> errored    : crash | unresponsive
    draining  --> suspended  : idle timeout | suspend
    draining  --> killed     : delete
    suspended --> resuming    : request | resume
    resuming  --> active
    resuming  --> errored
    errored   --> resuming   : redeploy
    killed    --> [*]`

export const LIFECYCLE_SWIMLANE_CHART = `sequenceDiagram
    participant Dev as Developer
    participant CLI
    participant API as Mgmt API
    participant VM as microVM
    participant Dash as Dashboard
    Dev->>CLI: supabase workers deploy embed
    CLI->>API: create worker (config.toml)
    API->>VM: build image, schedule
    VM-->>Dash: state deploying
    VM-->>Dash: state active (public URL)
    Dev->>VM: curl /v1/embed
    VM-->>Dash: request log
    Note over VM,Dash: idle timeout
    VM-->>Dash: draining then suspended`
