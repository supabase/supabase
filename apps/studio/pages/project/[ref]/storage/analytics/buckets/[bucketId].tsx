import { useParams } from 'common'
import { BUCKET_TYPES } from 'components/interfaces/Storage/Storage.constants'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import { Plus } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

// TODO:
// Add dynamic data from /components/interfaces/Storage/AnalyticBucketDetails/index.tsx
// Mark aforementioned components as deprecated in Linear (to remove post-launch)

const AnalyticsBucketPage: NextPageWithLayout = () => {
  const { bucketId, ref } = useParams()
  // If the bucket is not found or the bucket type is STANDARD or VECTOR, show an error message
  // if (!bucket || bucket.type !== 'ANALYTICS') {
  //   return (
  //     <div className="flex h-full w-full items-center justify-center">
  //       <p className="text-sm text-foreground-light">Bucket "{bucketId}" cannot be found</p>
  //     </div>
  //   )
  // }

  const config = BUCKET_TYPES['analytics']

  return (
    <>
      <PageLayout
        title={bucketId} // TODO: Change to bucket.name
        breadcrumbs={[
          {
            label: 'Analytics',
            href: `/project/${ref}/storage/analytics`,
          },
        ]}
        secondaryActions={config?.docsUrl ? [<DocsButton key="docs" href={config.docsUrl} />] : []}
      >
        <ScaffoldContainer>
          <ScaffoldSection isFullWidth>
            <Admonition
              title="Missing required integration"
              description="The Iceberg Wrapper integration is required to query analytics tables."
              type="warning"
            >
              {/* TODO: Should rightAction be built into Admonition? Like PageLayout */}
              {/* TODO: Update Admonition documentation */}
              <Button type="default" className="mt-3">
                Install
              </Button>
            </Admonition>

            <ScaffoldHeader className="flex flex-row justify-between items-end gap-x-8">
              <div>
                <ScaffoldSectionTitle>Tables</ScaffoldSectionTitle>
                <ScaffoldSectionDescription>
                  Analytics tables connected to this bucket.
                </ScaffoldSectionDescription>
              </div>
              <Button type="primary" size="tiny" icon={<Plus size={14} />}>
                New table
              </Button>
            </ScaffoldHeader>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground-muted">Name</TableHead>
                    <TableHead className="text-foreground-muted">Schema</TableHead>
                    <TableHead className="text-foreground-muted">Created at</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p className="text-sm text-foreground">No tables yet</p>
                      <p className="text-sm text-foreground-lighter">
                        Create an analytics table to get started.
                      </p>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </ScaffoldSection>

          <ScaffoldSection isFullWidth>
            <ScaffoldHeader className="flex flex-row justify-between items-end gap-x-8">
              <div>
                <ScaffoldSectionTitle>Connection details</ScaffoldSectionTitle>
                <ScaffoldSectionDescription>
                  Use these parameters to connect an Iceberg client to this bucket.
                </ScaffoldSectionDescription>
              </div>
              <DocsButton href={`${DOCS_URL}/storage/analytics/connecting-to-analytics-bucket`} />
            </ScaffoldHeader>
            <Card>
              {/* Table should match that in S3 connection */}
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Name</TableHead>
                    <TableHead className="w-full">Value</TableHead>
                    <TableHead className="w-48" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="w-1/3">
                      <p className="text-sm text-foreground">Catalog URI</p>
                    </TableCell>
                    <TableCell className="w-full">
                      {/* <div className="truncate"> */}
                      <div className="py-2 px-4 text-xs font-mono text-foreground-light flex border border-control bg-foreground/[.026] font-mono rounded-full overflow-hidden">
                        https://{ref}.storage.supabase.co/storage/v1/iceberg
                      </div>
                    </TableCell>
                    <TableCell className="w-48 align-middle">
                      <div className="flex flex-row gap-x-2 items-center justify-end">
                        {/* <Button type="default" size="tiny" disabled>
                          Show
                        </Button> */}
                        <Button type="default" size="tiny">
                          Copy
                        </Button>
                        <Button type="default" size="tiny">
                          Vault
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1/3">
                      <p className="text-sm text-foreground">Catalog token</p>
                      <p className="text-sm text-foreground-lighter text-balance">
                        Corresponds to the service role key
                      </p>
                    </TableCell>
                    <TableCell className="w-full">
                      {/* Match styling in ApiKeyRow -> ApiKeyPill */}
                      <div className="py-2 px-4 text-xs font-mono text-foreground-light flex border border-control bg-foreground/[.026] font-mono rounded-full overflow-hidden">
                        •••••••••••••••••••••••••••••••••••••••
                      </div>
                    </TableCell>
                    <TableCell className="w-48 align-middle">
                      <div className="flex flex-row gap-x-2 items-center justify-end">
                        <Button type="default" size="tiny">
                          Show
                        </Button>
                        <Button type="default" size="tiny">
                          Copy
                        </Button>
                        <Button type="default" size="tiny">
                          Vault
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </ScaffoldSection>

          <ScaffoldSection isFullWidth className="flex flex-col gap-y-4">
            <header>
              <ScaffoldSectionTitle>Manage</ScaffoldSectionTitle>
            </header>
            <Card>
              <CardContent className="flex flex-col md:flex-row md:justify-between gap-y-4 gap-x-8 md:items-center">
                <div className="flex flex-col">
                  <h3>Delete bucket</h3>
                  <p className="text-sm text-foreground-light">
                    This will also delete any data in your bucket. Make sure you have a backup if
                    you want to keep your data.
                  </p>
                </div>
                <Button type="danger">Delete bucket</Button>
              </CardContent>
            </Card>
          </ScaffoldSection>
        </ScaffoldContainer>
      </PageLayout>
    </>
  )
}

AnalyticsBucketPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default AnalyticsBucketPage
