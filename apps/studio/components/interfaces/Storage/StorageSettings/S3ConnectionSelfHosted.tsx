import { useParams } from 'common'
import {
  Card,
  CardContent,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { getConnectionURL } from './StorageSettings.utils'
import { DocsButton } from '@/components/ui/DocsButton'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useStorageCredentialsQuery } from '@/data/storage/s3-access-key-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

export const S3ConnectionSelfHosted = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: storageCreds } = useStorageCredentialsQuery({ projectRef })

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.storage_endpoint || settings?.app_config?.endpoint
  const s3ConnectionUrl = getConnectionURL(projectRef ?? '', protocol, endpoint)
  const accessKeys = storageCreds?.data ?? []

  return (
    <PageContainer>
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Connection</PageSectionTitle>
            <PageSectionDescription>
              Connect to your bucket using any S3-compatible service via the S3 protocol
            </PageSectionDescription>
          </PageSectionSummary>
          <PageSectionAside>
            <DocsButton href={`${DOCS_URL}/guides/self-hosting/self-hosted-s3`} />
          </PageSectionAside>
        </PageSectionMeta>

        <PageSectionContent className="space-y-4">
          <Admonition
            type="default"
            className="mt-2"
            title="Self-hosted Supabase"
            description={
              <p>
                S3 protocol settings are configured via your{' '}
                <code className="text-code-inline">.env</code> and{' '}
                <code className="text-code-inline">docker-compose.yml</code>.
              </p>
            }
          />
          <Card>
            <CardContent>
              <FormItemLayout
                layout="flex-row-reverse"
                className="[&>*>label]:text-foreground"
                label="S3 protocol connection"
                description="Allow clients to connect to Supabase Storage via the S3 protocol"
                isReactForm={false}
              >
                <Switch size="large" checked disabled />
              </FormItemLayout>
            </CardContent>
            <CardContent>
              <FormItemLayout
                layout="flex-row-reverse"
                className="[&>div]:md:w-1/2 [&>div>div]:w-full [&>div]:min-w-100"
                label="Endpoint"
                isReactForm={false}
              >
                <Input readOnly copy value={s3ConnectionUrl} />
              </FormItemLayout>
            </CardContent>
            <CardContent>
              <FormItemLayout
                layout="flex-row-reverse"
                className="[&>div]:md:w-1/2 [&>div>div]:w-full [&>div]:min-w-100"
                label="Region"
                isReactForm={false}
              >
                <Input readOnly copy value={project?.region ?? ''} />
              </FormItemLayout>
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Access keys</PageSectionTitle>
            <PageSectionDescription>View your access key</PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>

        <PageSectionContent>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead key="description">Name</TableHead>
                  <TableHead key="access-key-id">Key ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessKeys.length > 0 ? (
                  accessKeys.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell>
                        <span className="text-foreground">{cred.description}</span>
                      </TableCell>
                      <TableCell>
                        <Input readOnly copy value={cred.access_key} className="font-mono" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="rounded-b-md! overflow-hidden">
                      <p className="text-sm text-foreground">No access key configured</p>
                      <p className="text-sm text-foreground-light">
                        Set <code className="text-code-inline">STORAGE_S3_ACCESS_KEY</code> in your{' '}
                        <code className="text-code-inline">.env</code>.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
