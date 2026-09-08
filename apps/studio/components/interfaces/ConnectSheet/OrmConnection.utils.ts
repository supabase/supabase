import type {
  ConnectionStringPooler,
  DeploymentMode,
} from '@/components/interfaces/ConnectSheet/Connect.types'

export type OrmConnectionScenario =
  | 'cli'
  | 'self-hosted'
  | 'high-availability'
  | 'dedicated-pooler'
  | 'shared-pooler-with-dedicated-alternative'
  | 'shared-pooler'

/**
 * Resolves which connection setup an ORM env template should render.
 * Shared by the ORM step contents (Prisma, Drizzle) so they only differ in
 * formatting, not in how the scenario is picked.
 */
export const resolveOrmConnectionScenario = ({
  connectionStringPooler,
  deploymentMode,
  isHighAvailability,
}: {
  connectionStringPooler: ConnectionStringPooler
  deploymentMode: DeploymentMode
  isHighAvailability: boolean
}): OrmConnectionScenario => {
  if (deploymentMode.isCli) return 'cli'
  if (deploymentMode.isSelfHosted) return 'self-hosted'
  if (isHighAvailability) return 'high-availability'

  if (connectionStringPooler.transactionDedicated) {
    return connectionStringPooler.ipv4SupportedForDedicatedPooler
      ? 'dedicated-pooler'
      : 'shared-pooler-with-dedicated-alternative'
  }

  return 'shared-pooler'
}
