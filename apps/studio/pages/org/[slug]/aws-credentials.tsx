import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardFooter, cn } from 'ui'
import { Admonition } from 'ui-patterns'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import DefaultLayout from '@/components/layouts/DefaultLayout'
import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import type { NextPageWithLayout } from '@/types'

const inputClass =
  'flex h-[34px] w-full rounded-md border border-control bg-foreground/[.026] px-3 py-2 text-sm placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background-control'

const REQUIRED_PERMISSIONS = [
  'sts:GetCallerIdentity',
  'ec2:DescribeInstances',
  'ec2:DescribeRegions',
  'ec2:RunInstances',
  'ec2:TerminateInstances',
  'ec2:CreateSecurityGroup',
  'ec2:AuthorizeSecurityGroupIngress',
  'ec2:CreateTags',
]

const OrgAwsCredentials: NextPageWithLayout = () => {
  const { slug } = useParams()
  const base = `/dashboard/api/platform/organizations/${slug}/aws-credentials`

  const [status, setStatus] = useState<{ exists?: boolean; validated?: boolean; accessKeyId?: string; defaultRegion?: string } | null>(null)
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [defaultRegion, setDefaultRegion] = useState('us-east-1')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(base)
      const data = res.ok ? await res.json() : null
      setStatus(data)
      if (data?.defaultRegion) setDefaultRegion(data.defaultRegion)
    } catch {
      setStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (slug) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const onSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKeyId, secretAccessKey, defaultRegion }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? 'Failed to save AWS credentials')
      }
      toast.success('AWS credentials validated and saved')
      setAccessKeyId('')
      setSecretAccessKey('')
      await refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const onRemove = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(base, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove AWS credentials')
      toast.success('AWS credentials removed')
      await refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const hasCreds = !!(status?.exists || status?.validated)

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>AWS Credentials</PageHeaderTitle>
            <PageHeaderDescription>
              Bring your own AWS account to deploy dedicated projects. Each organization has its own
              set of credentials.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <ScaffoldContainer size="small" className="px-6 xl:px-10">
        <ScaffoldSection isFullWidth>
          <Admonition
            type="default"
            title="Required IAM permissions"
            description={
              <div className="flex flex-col gap-y-2">
                <p>
                  Provide an IAM user/role access key whose policy grants at least the following
                  permissions. Credentials are validated with AWS STS, encrypted at rest, and never
                  shown again after saving.
                </p>
                <ul className="list-disc list-inside font-mono text-xs">
                  {REQUIRED_PERMISSIONS.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            }
          />

          <Card className="mt-4">
            <CardContent className="flex flex-col gap-4 pt-6">
              {hasCreds && (
                <p className="text-sm text-foreground-light">
                  Credentials are configured
                  {status?.accessKeyId ? ` (••••${String(status.accessKeyId).slice(-4)})` : ''}
                  {status?.validated === false ? ' — last validation failed.' : '.'} Submit a new key
                  pair below to replace them.
                </p>
              )}
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-sm text-foreground-light">Access key ID</label>
                <input
                  className={cn(inputClass, 'col-span-8')}
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  placeholder="AKIA..."
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-sm text-foreground-light">Secret access key</label>
                <input
                  className={cn(inputClass, 'col-span-8')}
                  type="password"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-12 gap-2 items-center">
                <label className="col-span-4 text-sm text-foreground-light">Default region</label>
                <input
                  className={cn(inputClass, 'col-span-8')}
                  value={defaultRegion}
                  onChange={(e) => setDefaultRegion(e.target.value)}
                  placeholder="us-east-1"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-x-2">
              {hasCreds && (
                <Button type="default" disabled={isSaving || isLoading} onClick={onRemove}>
                  Remove
                </Button>
              )}
              <Button
                type="primary"
                loading={isSaving}
                disabled={isSaving || !accessKeyId || !secretAccessKey || !defaultRegion}
                onClick={onSave}
              >
                Validate & save
              </Button>
            </CardFooter>
          </Card>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

OrgAwsCredentials.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="AWS Credentials">
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)
export default OrgAwsCredentials
