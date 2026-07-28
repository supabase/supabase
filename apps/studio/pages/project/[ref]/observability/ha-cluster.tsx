import { useParams } from 'common'
import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from 'ui'

import ReportHeader from '@/components/interfaces/Reports/ReportHeader'
import ReportPadding from '@/components/interfaces/Reports/ReportPadding'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import Table from '@/components/to-be-cleaned/Table'
import { HighAvailabilityDisabledEmptyState } from '@/components/ui/HighAvailability/HighAvailabilityDisabledEmptyState'
import { ObservabilityLink } from '@/components/ui/ObservabilityLink'
import Panel from '@/components/ui/Panel'
import {
  useHaClusterCellsQuery,
  useHaClusterDatabasesQuery,
  useHaClusterGatewaysQuery,
  useHaClusterPoolersQuery,
} from '@/data/ha-admin/ha-cluster-queries'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import type { NextPageWithLayout } from '@/types'

const HaClusterReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <HaCluster />
    </ReportPadding>
  )
}

HaClusterReport.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="HA cluster">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default HaClusterReport

const REPORT_TITLE = 'HA cluster'

/**
 * Throwaway demo section: proves Studio can drive the mgmt-api `/ha-admin`
 * passthrough end-to-end (Studio → mgmt-api → multiadmin) by rendering live
 * cluster topology. Not a polished/production dashboard.
 */
const HaCluster = () => {
  const { ref } = useParams()
  const { isHighAvailability, isPending: isProjectPending } = useHighAvailability()

  const enabled = isHighAvailability
  const poolers = useHaClusterPoolersQuery({ projectRef: ref }, { enabled })
  const gateways = useHaClusterGatewaysQuery({ projectRef: ref }, { enabled })
  const cells = useHaClusterCellsQuery({ projectRef: ref }, { enabled })
  const databases = useHaClusterDatabasesQuery({ projectRef: ref }, { enabled })

  if (!isProjectPending && !isHighAvailability) {
    return (
      <div className="py-12">
        <HighAvailabilityDisabledEmptyState
          title="HA cluster observability is only available on High Availability projects"
          description="This project is not running on Multigres."
        />
      </div>
    )
  }

  return (
    <>
      <ReportHeader showDatabaseSelector={false} title={REPORT_TITLE} />

      <Alert variant="default" className="mb-6">
        <AlertTitle>Experimental</AlertTitle>
        <AlertDescription>
          Live data from the project&apos;s Multigres cluster, served through the Management API{' '}
          <code>/ha-admin</code> passthrough to multiadmin.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-6">
        <HaAdminSection
          title="Poolers"
          description="One primary + replicas per shard, each fronted by a pooler."
          query={poolers}
          isEmpty={(poolers.data?.poolers?.length ?? 0) === 0}
          emptyText="No poolers reported."
        >
          <Table
            head={[
              <Table.th key="pooler">Pooler</Table.th>,
              <Table.th key="role">Role</Table.th>,
              <Table.th key="serving">Serving</Table.th>,
              <Table.th key="lifecycle">Lifecycle</Table.th>,
              <Table.th key="shard">Shard</Table.th>,
              <Table.th key="host">Host</Table.th>,
            ]}
            body={(poolers.data?.poolers ?? []).map((p, i) => (
              <Table.tr key={`${p.id?.cell ?? ''}/${p.id?.name ?? ''}/${i}`}>
                <Table.td>
                  {p.id?.cell ?? '—'} / {p.id?.name ?? '—'}
                </Table.td>
                <Table.td>{p.routingState?.role ?? p.type ?? '—'}</Table.td>
                <Table.td>{p.servingStatus ?? '—'}</Table.td>
                <Table.td>{p.lifecycleStatus?.status ?? '—'}</Table.td>
                <Table.td>
                  {p.shardKey
                    ? `${p.shardKey.database ?? '—'}/${p.shardKey.tableGroup ?? '—'}/${p.shardKey.shard ?? '—'}`
                    : '—'}
                </Table.td>
                <Table.td className="font-mono text-xs">{p.hostname ?? '—'}</Table.td>
              </Table.tr>
            ))}
          />
        </HaAdminSection>

        <HaAdminSection
          title="Gateways"
          description="Multigateway instances routing traffic into the cluster."
          query={gateways}
          isEmpty={(gateways.data?.gateways?.length ?? 0) === 0}
          emptyText="No gateways reported."
        >
          <Table
            head={[
              <Table.th key="gateway">Gateway</Table.th>,
              <Table.th key="host">Host</Table.th>,
            ]}
            body={(gateways.data?.gateways ?? []).map((g, i) => (
              <Table.tr key={`${g.id?.cell ?? ''}/${g.id?.name ?? ''}/${i}`}>
                <Table.td>
                  {g.id?.cell ?? '—'} / {g.id?.name ?? '—'}
                </Table.td>
                <Table.td className="font-mono text-xs">{g.hostname ?? '—'}</Table.td>
              </Table.tr>
            ))}
          />
        </HaAdminSection>

        <HaAdminSection
          title="Cells"
          query={cells}
          isEmpty={(cells.data?.names?.length ?? 0) === 0}
          emptyText="No cells reported."
        >
          <Table
            head={[<Table.th key="cell">Cell</Table.th>]}
            body={(cells.data?.names ?? []).map((name) => (
              <Table.tr key={name}>
                <Table.td>{name}</Table.td>
              </Table.tr>
            ))}
          />
        </HaAdminSection>

        <HaAdminSection
          title="Databases"
          query={databases}
          isEmpty={(databases.data?.names?.length ?? 0) === 0}
          emptyText="No databases reported."
        >
          <Table
            head={[<Table.th key="database">Database</Table.th>]}
            body={(databases.data?.names ?? []).map((name) => (
              <Table.tr key={name}>
                <Table.td>{name}</Table.td>
              </Table.tr>
            ))}
          />
        </HaAdminSection>
      </div>

      <div className="py-8">
        <ObservabilityLink />
      </div>
    </>
  )
}

const HaAdminSection = ({
  title,
  description,
  query,
  isEmpty,
  emptyText,
  children,
}: {
  title: string
  description?: string
  query: { isLoading: boolean; isError: boolean; error: { message: string } | null }
  isEmpty: boolean
  emptyText: string
  children: ReactNode
}) => {
  return (
    <Panel title={title}>
      <Panel.Content>
        {description && <p className="text-sm text-foreground-light mb-4">{description}</p>}
        {query.isLoading && <p className="text-sm text-foreground-light">Loading…</p>}
        {query.isError && (
          <p className="text-sm text-warning">
            {query.error?.message ?? 'Failed to load from the HA admin service.'}
          </p>
        )}
        {!query.isLoading && !query.isError && isEmpty && (
          <p className="text-sm text-foreground-light">{emptyText}</p>
        )}
        {!query.isLoading && !query.isError && !isEmpty && children}
      </Panel.Content>
    </Panel>
  )
}
