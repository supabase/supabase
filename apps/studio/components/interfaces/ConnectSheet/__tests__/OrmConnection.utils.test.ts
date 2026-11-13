import { describe, expect, test } from 'vitest'

import type { ConnectionStringPooler } from '../Connect.types'
import { resolveOrmConnectionScenario } from '../OrmConnection.utils'
import type { DeploymentMode } from '@/hooks/misc/useDeploymentMode'

const platform: DeploymentMode = { isPlatform: true, isCli: false, isSelfHosted: false }
const cli: DeploymentMode = { isPlatform: false, isCli: true, isSelfHosted: false }
const selfHosted: DeploymentMode = { isPlatform: false, isCli: false, isSelfHosted: true }

const makePooler = (overrides: Partial<ConnectionStringPooler> = {}): ConnectionStringPooler => ({
  transactionShared: 'postgresql://shared:6543/postgres',
  sessionShared: 'postgresql://shared:5432/postgres',
  ipv4SupportedForDedicatedPooler: false,
  direct: 'postgresql://direct:5432/postgres',
  ...overrides,
})

describe('resolveOrmConnectionScenario', () => {
  test('resolves cli for CLI deployments', () => {
    const scenario = resolveOrmConnectionScenario({
      connectionStringPooler: makePooler(),
      deploymentMode: cli,
      hasConnectionPooling: true,
    })
    expect(scenario).toBe('cli')
  })

  test('resolves self-hosted for self-hosted deployments', () => {
    const scenario = resolveOrmConnectionScenario({
      connectionStringPooler: makePooler(),
      deploymentMode: selfHosted,
      hasConnectionPooling: true,
    })
    expect(scenario).toBe('self-hosted')
  })

  test('resolves no-pooler for HA projects on platform', () => {
    const scenario = resolveOrmConnectionScenario({
      connectionStringPooler: makePooler(),
      deploymentMode: platform,
      hasConnectionPooling: false,
    })
    expect(scenario).toBe('no-pooler')
  })

  test('resolves no-pooler for Multigres Lite projects on platform', () => {
    const scenario = resolveOrmConnectionScenario({
      connectionStringPooler: makePooler(),
      deploymentMode: platform,
      hasConnectionPooling: false,
    })
    expect(scenario).toBe('no-pooler')
  })

  test('cli wins over the no-pooling flag', () => {
    const scenario = resolveOrmConnectionScenario({
      connectionStringPooler: makePooler(),
      deploymentMode: cli,
      hasConnectionPooling: false,
    })
    expect(scenario).toBe('cli')
  })

  test('resolves dedicated-pooler when the dedicated pooler exists and IPv4 is supported', () => {
    const scenario = resolveOrmConnectionScenario({
      connectionStringPooler: makePooler({
        transactionDedicated: 'postgresql://dedicated:6543/postgres',
        sessionDedicated: 'postgresql://dedicated:5432/postgres',
        ipv4SupportedForDedicatedPooler: true,
      }),
      deploymentMode: platform,
      hasConnectionPooling: true,
    })
    expect(scenario).toBe('dedicated-pooler')
  })

  test('resolves shared-pooler-with-dedicated-alternative when the dedicated pooler exists without IPv4 support', () => {
    const scenario = resolveOrmConnectionScenario({
      connectionStringPooler: makePooler({
        transactionDedicated: 'postgresql://dedicated:6543/postgres',
        sessionDedicated: 'postgresql://dedicated:5432/postgres',
        ipv4SupportedForDedicatedPooler: false,
      }),
      deploymentMode: platform,
      hasConnectionPooling: true,
    })
    expect(scenario).toBe('shared-pooler-with-dedicated-alternative')
  })

  test('falls back to shared-pooler when there is no dedicated pooler', () => {
    const scenario = resolveOrmConnectionScenario({
      connectionStringPooler: makePooler(),
      deploymentMode: platform,
      hasConnectionPooling: true,
    })
    expect(scenario).toBe('shared-pooler')
  })
})
