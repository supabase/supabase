import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { formatBytes } from 'lib/helpers'
import { DocsButton } from 'components/ui/DocsButton'
import { Markdown } from 'components/interfaces/Markdown'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { Button, Card, CardHeader, CardContent } from 'ui'
import { Admonition } from 'ui-patterns'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import { DiskSizeConfigurationModal } from './DiskSizeConfigurationModal'

export interface DiskSizeConfigurationProps {
  disabled?: boolean
}

export const DiskSizeConfiguration = ({ disabled = false }: DiskSizeConfigurationProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const currentDiskSize = project?.volumeSizeGb ?? 0

  const { data } = useDatabaseSizeQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const databaseSizeBytesUsed = data ?? 0

  return (
    <ScaffoldSection id="disk-management" className="gap-6">
      <ScaffoldSectionTitle className="flex items-center justify-between">
        Disk Management
        <DocsButton href="https://supabase.com/docs/guides/platform/database-size#disk-management" />
      </ScaffoldSectionTitle>
      {organization?.usage_billing_enabled === true ? (
        <>
          <Admonition
            type="default"
            title="Importing a lot of data?"
            description={
              <Markdown
                content={`
We auto-scale your disk as you need more storage, but can only do this once every 6 hours. If you upload more than 1.5x the current size of your storage, your database will go into read-only mode. If you know how big your database is going to be, you can manually increase the size here.

Read more about [disk management](https://supabase.com/docs/guides/platform/database-size#disk-management) and how to [free up storage space](https://supabase.com/docs/guides/platform/database-size#vacuum-operations).
`}
              />
            }
          />
          <Card>
            <CardHeader>Disk Size Configuration</CardHeader>

            <CardContent className="flex justify-between items-center">
              <FormLayout
                layout="flex-row-reverse"
                className="w-full"
                label="Current Disk Storage"
                description={
                  <div className="flex text-lg mt-2 gap-6">
                    <div className="flex flex-col items-center gap-1">
                      <h5>Space used</h5>
                      {formatBytes(databaseSizeBytesUsed, 2, 'GB')}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <h5>Total size</h5>
                      {currentDiskSize} GB
                    </div>
                  </div>
                }
              >
                <Button asChild type="default" iconRight={<ExternalLink size={14} />}>
                  <Link href={`/project/${projectRef}/reports/database#database-size-report`}>
                    View detailed summary
                  </Link>
                </Button>
              </FormLayout>
            </CardContent>

            <CardContent className="flex justify-between items-center">
              <FormLayout
                layout="flex-row-reverse"
                label="Manage Disk Size"
                description="Supabase employs auto-scaling storage and allows for manual disk size adjustments when necessary."
              >
                <DiskSizeConfigurationModal disabled={disabled} />
              </FormLayout>
            </CardContent>
          </Card>
        </>
      ) : (
        <Admonition
          type="default"
          title={
            organization?.plan?.id === 'free'
              ? 'Disk size configuration is not available for projects on the Free Plan'
              : 'Disk size configuration is only available when the spend cap has been disabled'
          }
          description={
            <>
              <p>
                {organization?.plan?.id === 'free'
                  ? `If you are intending to use more than 500MB of disk space, then you will need to upgrade to at least the Pro Plan.`
                  : `If you are intending to use more than 8GB of disk space, then you will need to disable your spend cap.`}
              </p>
              <Button asChild type="default" className="mt-4">
                <Link
                  href={`/org/${organization?.slug}/billing?panel=${
                    organization?.plan?.id === 'free' ? 'subscriptionPlan' : 'costControl'
                  }`}
                  target="_blank"
                >
                  {organization?.plan?.id === 'free' ? 'Upgrade subscription' : 'Disable spend cap'}
                </Link>
              </Button>
            </>
          }
        />
      )}
    </ScaffoldSection>
  )
}
