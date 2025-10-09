import { useParams } from 'common'
import {
  DESCRIPTIONS,
  LABELS,
  OPTION_ORDER,
} from 'components/interfaces/Storage/AnalyticBucketDetails/constants'
import { DeleteBucketModal } from 'components/interfaces/Storage/DeleteBucketModal'
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
import CopyButton from 'components/ui/CopyButton'
import { DocsButton } from 'components/ui/DocsButton'
import { InlineLink } from 'components/ui/InlineLink'
import { DOCS_URL } from 'lib/constants'
import { ExternalLink, Eye, EyeOff, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

// TODO:
// Add dynamic data from /components/interfaces/Storage/AnalyticBucketDetails/index.tsx
// Mark aforementioned components as deprecated in Linear (to remove post-launch)

const AnalyticsBucketPage: NextPageWithLayout = () => {
  const { bucketId, ref } = useParams()
  const [showToken, setShowToken] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Temporary mock data
  const mockBucket = {
    id: bucketId || '',
    name: bucketId || '',
    type: 'ANALYTICS' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner: 'mock-owner',
    // TODO: below properties are irrelevant for analytics buckets, consider removing from DeleteBucketModal props
    public: false,
    allowed_mime_types: [],
    file_size_limit: undefined,
  }

  // If the bucket is not found or the bucket type is STANDARD or VECTOR, show an error message
  // if (!bucket || bucket.type !== 'ANALYTICS') {
  //   return (
  //     <div className="flex h-full w-full items-center justify-center">
  //       <p className="text-sm text-foreground-light">Bucket "{bucketId}" cannot be found</p>
  //     </div>
  //   )
  // }

  const config = BUCKET_TYPES['analytics']

  // Mock data
  // TODO: Replace with actual data from API
  const connectionData = {
    catalog_uri: `https://${ref}.storage.supabase.co/storage/v1/iceberg`,
    vault_token: 'sk_test_1234567890abcdef1234567890abcdef12345678',
    warehouse: bucketId,
    's3.endpoint': `https://${ref}.storage.supabase.co`,
    vault_aws_access_key_id: 'AKIAIOSFODNN7EXAMPLE',
    vault_aws_secret_access_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  }

  // Helper functions to determine row behavior
  const isSecret = (key: string) => {
    return ['vault_token', 'vault_aws_access_key_id', 'vault_aws_secret_access_key'].includes(key)
  }

  const hasVault = (key: string) => {
    return ['vault_token'].includes(key)
  }

  const handleToggleToken = () => {
    setShowToken(!showToken)
  }

  const handleCopyValue = async (key: string) => {
    return connectionData[key as keyof typeof connectionData] || ''
  }

  // Component to render a connection detail row
  const renderConnectionRow = (key: string) => {
    const label = LABELS[key]
    const description = DESCRIPTIONS[key]
    const value = connectionData[key as keyof typeof connectionData] || ''
    const isSecretValue = isSecret(key)
    const hasVaultValue = hasVault(key)

    return (
      <TableRow key={key}>
        <TableCell>
          <p className="text-sm text-foreground">{label}</p>
          {/* {description && (
            <p className="text-sm text-foreground-lighter text-balance">{description}</p>
          )} */}
        </TableCell>
        <TableCell>
          <div className="-mx-3 mr-3 py-1.5 px-3 truncate text-xs font-mono text-foreground-light flex border bg-foreground/[.026] font-mono rounded-full overflow-hidden">
            {isSecretValue ? (
              <>
                <span>{value.slice(0, 15)}</span>
                <span>
                  {showToken ? value.slice(15) : '••••••••••••••••••••••••••••••••••••••'}
                </span>
              </>
            ) : (
              <span>{value}</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-row gap-x-2 items-center justify-end">
            {/* Reveal/Hide button for secret values */}
            {isSecretValue && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="outline"
                    className="rounded-full px-2 pointer-events-auto bg-alternative"
                    icon={showToken ? <EyeOff strokeWidth={2} /> : <Eye strokeWidth={2} />}
                    onClick={handleToggleToken}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">{showToken ? `Hide` : `Reveal`}</TooltipContent>
              </Tooltip>
            )}

            {/* Copy button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <CopyButton
                  type="default"
                  asyncText={() => handleCopyValue(key)}
                  iconOnly
                  className="rounded-full px-2 pointer-events-auto bg-alternative"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">Copy</TooltipContent>
            </Tooltip>

            {/* Vault button for values that have vault */}
            {hasVaultValue && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    type="outline"
                    className="rounded-full px-2 pointer-events-auto bg-alternative"
                    icon={<ExternalLink strokeWidth={2} />}
                    aria-label="Open in Vault"
                  >
                    <Link href={`/project/${ref}/integrations/vault/secrets?search=${value}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Open in Vault</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      <PageLayout
        title={mockBucket.name}
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
              title="Missing integration"
              description={
                <p>
                  The Iceberg Wrapper integration is required for querying analytical data.{' '}
                  <InlineLink
                    href={`${DOCS_URL}/guides/database/extensions/wrappers/iceberg`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground-lighter hover:text-foreground transition-colors"
                  >
                    Learn more
                  </InlineLink>
                </p>
              }
              type="warning"
            >
              {/* TODO: Update Admonition documentation */}
              <Button type="warning" className="mt-3">
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
                        Create an analytics table to get started
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
              <DocsButton
                href={`${DOCS_URL}/guides/storage/analytics/connecting-to-analytics-bucket`}
              />
            </ScaffoldHeader>
            <Card>
              {/* Table should match that in S3 connection */}
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>{OPTION_ORDER.map((key) => renderConnectionRow(key))}</TableBody>
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
                  <p className="text-sm text-foreground-lighter">
                    This will also delete any data in your bucket. Make sure you have a backup if
                    you want to keep your data.
                  </p>
                </div>
                <Button type="danger" onClick={() => setShowDeleteModal(true)}>
                  Delete bucket
                </Button>
              </CardContent>
            </Card>
          </ScaffoldSection>
        </ScaffoldContainer>
      </PageLayout>

      <DeleteBucketModal
        visible={showDeleteModal}
        bucket={mockBucket}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  )
}

AnalyticsBucketPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default AnalyticsBucketPage
