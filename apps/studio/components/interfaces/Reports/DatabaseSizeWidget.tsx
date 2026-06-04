import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, Button } from 'ui'

import type { BaseReportParams } from './Reports.types'
import ReportWidget from './ReportWidget'
import DiskSizeConfigurationModal from '@/components/interfaces/Settings/Database/DiskSizeConfigurationModal'
import Table from '@/components/to-be-cleaned/Table'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DOCS_URL } from '@/lib/constants'
import { formatBytes } from '@/lib/helpers'

export interface DatabaseSizeWidgetProps {
  isLoading: boolean
  params: BaseReportParams
  data: Record<string, unknown>[]
  resolvedSql?: string
  databaseSizeBytes: number
  currentDiskSize: number
  projectRef: string | undefined
  cloudProvider: string | undefined
  canUpdateDiskSizeConfig: boolean
  showIncreaseDiskSizeModal: boolean
  isUpdatingDiskSize: boolean
  setShowIncreaseDiskSizeModal: (visible: boolean) => void
}

export function DatabaseSizeWidget({
  isLoading,
  params,
  data,
  resolvedSql,
  databaseSizeBytes,
  currentDiskSize,
  projectRef,
  cloudProvider,
  canUpdateDiskSizeConfig,
  showIncreaseDiskSizeModal,
  isUpdatingDiskSize,
  setShowIncreaseDiskSizeModal,
}: DatabaseSizeWidgetProps) {
  return (
    <section id="database-size-report">
      <ReportWidget
        isLoading={isLoading}
        params={params}
        title="Database Size"
        data={data}
        queryType="db"
        resolvedSql={resolvedSql}
        renderer={(props) => (
          <div>
            <div className="col-span-4 inline-grid grid-cols-12 gap-12 w-full mt-5">
              <div className="grid gap-2 col-span-4 xl:col-span-2">
                <h5>Space used</h5>
                <span className="text-lg">{formatBytes(databaseSizeBytes, 2, 'GB')}</span>
              </div>
              <div className="grid gap-2 col-span-4 xl:col-span-3">
                <h5>Provisioned disk size</h5>
                <span className="text-lg">{currentDiskSize} GB</span>
              </div>

              <div className="col-span-full lg:col-span-4 xl:col-span-7 lg:text-right">
                {cloudProvider === 'AWS' ? (
                  <Button asChild type="default">
                    <Link href={`/project/${projectRef}/settings/compute-and-disk`}>
                      Increase disk size
                    </Link>
                  </Button>
                ) : (
                  <ButtonTooltip
                    type="default"
                    disabled={!canUpdateDiskSizeConfig}
                    onClick={() => setShowIncreaseDiskSizeModal(true)}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canUpdateDiskSizeConfig
                          ? 'You need additional permissions to increase the disk size'
                          : undefined,
                      },
                    }}
                  >
                    Increase disk size
                  </ButtonTooltip>
                )}
              </div>
            </div>

            <h3 className="mt-8 text-sm">Large Objects</h3>
            {!props.isLoading && props.data.length === 0 && <span>No large objects found</span>}
            {!props.isLoading && props.data.length > 0 && (
              <Table
                className="space-y-3 mt-4"
                head={[
                  <Table.th key="object" className="py-2">
                    Object
                  </Table.th>,
                  <Table.th key="size" className="py-2">
                    Size
                  </Table.th>,
                ]}
                body={props.data?.map((object) => {
                  const percentage = (
                    ((object.table_size as number) / databaseSizeBytes) *
                    100
                  ).toFixed(2)

                  return (
                    <Table.tr key={`${object.schema_name}.${object.relname}`}>
                      <Table.td>
                        {object.schema_name}.{object.relname}
                      </Table.td>
                      <Table.td>
                        {formatBytes(object.table_size)} ({percentage}%)
                      </Table.td>
                    </Table.tr>
                  )
                })}
              />
            )}
          </div>
        )}
        append={() => (
          <div className="px-6 pb-6">
            <Alert variant="default" className="mt-4">
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    New Supabase projects have a database size of ~40-60mb. This space includes
                    pre-installed extensions, schemas, and default Postgres data. Additional
                    database size is used when installing extensions, even if those extensions are
                    inactive.
                  </p>

                  <Button asChild type="default" icon={<ExternalLink />}>
                    <Link
                      href={`${DOCS_URL}/guides/platform/database-size#disk-space-usage`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read about database size
                    </Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      />
      <DiskSizeConfigurationModal
        visible={showIncreaseDiskSizeModal}
        loading={isUpdatingDiskSize}
        hideModal={setShowIncreaseDiskSizeModal}
      />
    </section>
  )
}
