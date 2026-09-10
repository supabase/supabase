import { useParams } from 'common'
import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { WarehouseCatalogCredentials } from './Warehouse.utils'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { useWarehouseCatalogQuery } from '@/data/warehouse/warehouse-catalog-query'
import {
  DUCKLAKE_METADATA_PASSWORD_ENV_VAR,
  DUCKLAKE_S3_SECRET_ENV_VAR,
  getDuckLakeSetupScript,
  getWarehouseFlightSqlConnectionString,
  getWarehouseFlightSqlEndpoint,
  getWarehouseUsqlCommand,
  parseWarehouseCatalogUrl,
} from '@/lib/warehouse'

function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <FormLayout layout="horizontal" label={label}>
      {children}
    </FormLayout>
  )
}

/**
 * The DuckDB setup script inlines everything except the two passwords, which it reads via
 * `getenv()` — so those are the only credential values surfaced as their own rows here.
 */
function DuckLakeSetup({ credentials }: { credentials: WarehouseCatalogCredentials }) {
  const connection = parseWarehouseCatalogUrl(credentials.catalog_url)

  if (connection === null) {
    return (
      <div className="flex flex-col gap-3 mt-2">
        <Admonition
          type="warning"
          title="Could not read the catalog connection details"
          description="Copy the catalog URL and configure the DuckLake secrets manually."
        />
        <FieldRow label="Catalog URL">
          <Input readOnly copy reveal className="font-mono" value={credentials.catalog_url} />
        </FieldRow>
      </div>
    )
  }

  const setupScript = getDuckLakeSetupScript({ credentials, connection })

  return (
    <div className="flex flex-col gap-3 mt-2">
      <p className="text-sm text-foreground-light max-w-xl mb-1">
        Attach this project's Warehouse directly from DuckDB. The script reads both passwords from
        environment variables — set these before running it:
      </p>
      <FieldRow label={<span className="font-mono text-xs">{DUCKLAKE_S3_SECRET_ENV_VAR}</span>}>
        <Input
          readOnly
          copy
          reveal
          className="font-mono"
          value={credentials.s3_secret_access_key}
        />
      </FieldRow>
      <FieldRow
        label={<span className="font-mono text-xs">{DUCKLAKE_METADATA_PASSWORD_ENV_VAR}</span>}
      >
        <Input readOnly copy reveal className="font-mono" value={connection.password} />
      </FieldRow>
      {/*
        `className` is what switches CodeBlock from its plain <code> fallback to the syntax
        highlighter — without it the SQL renders unhighlighted and the blank lines between steps
        collapse.
      */}
      <CodeBlock
        className="[&_code]:text-foreground"
        language="sql"
        hideLineNumbers
        value={setupScript}
      />
    </div>
  )
}

/**
 * Read-only view of how to reach a project's Warehouse. Rendered both on the Warehouse integration
 * and in the Connect sheet, so it must not contain any action that changes Warehouse setup.
 */
export const WarehouseConnectionDetails = () => {
  const { ref: projectRef } = useParams()

  const {
    data: catalog,
    isPending: isCatalogPending,
    isError: isCatalogError,
    error: catalogError,
  } = useWarehouseCatalogQuery({ projectRef })

  if (!projectRef) return null

  const endpoint = getWarehouseFlightSqlEndpoint(projectRef)
  const connectionString = getWarehouseFlightSqlConnectionString(projectRef)
  const usqlCommand = getWarehouseUsqlCommand(projectRef)

  return (
    <>
      <PageSection className="first:pt-0">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>External access</PageSectionTitle>
            <PageSectionDescription>
              Credentials for connecting analytical tools to Warehouse.
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent className="space-y-4">
              <FieldRow label="Endpoint">
                <Input readOnly copy className="font-mono" value={endpoint} />
              </FieldRow>
              <FieldRow label="Connection string">
                <Input readOnly copy className="font-mono" value={connectionString} />
              </FieldRow>
              <FieldRow label="User">
                <Input readOnly copy className="font-mono" value="postgres" />
              </FieldRow>
              <FieldRow label="Password">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-foreground-light">
                    Same password as your primary database.
                  </span>
                  <Button
                    asChild
                    variant="default"
                    size="tiny"
                    icon={<KeyRound size={14} />}
                    className="ml-auto"
                  >
                    <Link href={`/project/${projectRef}/settings/database`}>
                      Reset database password
                    </Link>
                  </Button>
                </div>
              </FieldRow>
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Connect with FlightSQL</PageSectionTitle>
            <PageSectionDescription>
              Warehouse speaks the Arrow FlightSQL protocol, so any FlightSQL client can connect.
              For example, using the usql CLI:
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <CodeBlock
            className="[&_code]:text-foreground"
            language="bash"
            hideLineNumbers
            wrapLongLines
            value={usqlCommand}
          />
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Connect with DuckDB</PageSectionTitle>
            <PageSectionDescription>
              Attach Warehouse from DuckDB through its DuckLake catalog.
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          {isCatalogPending && <GenericSkeletonLoader />}

          {isCatalogError && (
            <AlertError subject="Failed to load DuckLake catalog access" error={catalogError} />
          )}

          {!isCatalogPending && !isCatalogError && !catalog?.enabled && (
            <p className="text-sm text-foreground-light max-w-lg">
              Catalog access is off. Turn it on in{' '}
              <InlineLink href={`/project/${projectRef}/integrations/warehouse/settings`}>
                Warehouse settings
              </InlineLink>{' '}
              to attach this project&apos;s Warehouse from DuckDB.
            </p>
          )}

          {!isCatalogPending && !isCatalogError && catalog?.enabled && catalog.credentials && (
            <DuckLakeSetup credentials={catalog.credentials} />
          )}
        </PageSectionContent>
      </PageSection>
    </>
  )
}
