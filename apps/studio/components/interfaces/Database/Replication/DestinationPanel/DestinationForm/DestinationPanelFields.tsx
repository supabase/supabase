import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Check, Database, Eye, EyeOff, Loader2, Plus, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  FormControl,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  TextArea,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  CREATE_NEW_KEY,
  CREATE_NEW_NAMESPACE,
  DUCKLAKE_MODE_CUSTOM,
  DUCKLAKE_MODE_SUPABASE,
  type DucklakeMode,
} from './DestinationForm.constants'
import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { InlineLink } from '@/components/ui/InlineLink'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useAnalyticsBucketsQuery } from '@/data/storage/analytics-buckets-query'
import { useBucketCreateMutation } from '@/data/storage/bucket-create-mutation'
import { usePaginatedBucketsQuery } from '@/data/storage/buckets-query'
import { useIcebergNamespacesQuery } from '@/data/storage/iceberg-namespaces-query'
import { useStorageCredentialsQuery } from '@/data/storage/s3-access-key-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

export const BigQueryFields = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  return (
    <div className="flex flex-col gap-y-6 p-5">
      <p className="text-sm font-medium text-foreground">BigQuery settings</p>
      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Project ID"
              description="The Google Cloud project ID where data will be sent"
            >
              <FormControl>
                <Input {...field} placeholder="my-gcp-project" />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="datasetId"
          render={({ field }) => (
            <FormItemLayout
              label="Dataset ID"
              layout="horizontal"
              description="The BigQuery dataset where replicated tables will be created"
            >
              <FormControl>
                <Input {...field} placeholder="my_dataset" />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="serviceAccountKey"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Service Account Key"
              description="Service account credentials JSON for authenticating with BigQuery"
            >
              <FormControl>
                <TextArea
                  {...field}
                  rows={5}
                  maxLength={5000}
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  className="font-mono text-xs"
                />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>
    </div>
  )
}

const DUCKLAKE_MODE_OPTIONS = [
  {
    value: DUCKLAKE_MODE_SUPABASE,
    icon: Database,
    label: 'Use Supabase',
    description:
      'Create or use a DuckLake backed by your Supabase projects. Catalog and storage are managed for you.',
  },
  {
    value: DUCKLAKE_MODE_CUSTOM,
    icon: SlidersHorizontal,
    label: 'Custom parameters',
    description: 'Bring your own PostgreSQL catalog and S3-compatible object storage credentials.',
  },
] as const

const DuckLakeModeSelector = ({
  value,
  onChange,
}: {
  value: DucklakeMode
  onChange: (value: DucklakeMode) => void
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="DuckLake configuration mode"
      className="grid grid-cols-2 gap-3"
    >
      {DUCKLAKE_MODE_OPTIONS.map((option) => {
        const Icon = option.icon
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex flex-col gap-y-3 rounded-md border p-4 text-left transition',
              'hover:border-foreground-muted',
              selected
                ? 'border-foreground-muted bg-surface-300 ring-1 ring-border'
                : 'border-default bg-surface-100'
            )}
          >
            <div className="flex items-start justify-between">
              <Icon size={18} strokeWidth={1.5} className="text-foreground-light" />
              {selected ? (
                <Check size={16} className="text-brand" />
              ) : (
                <span className="h-4 w-4 rounded-full border border-strong" />
              )}
            </div>
            <div className="flex flex-col gap-y-1">
              <span className="text-sm text-foreground">{option.label}</span>
              <span className="text-xs text-foreground-light">{option.description}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

const DuckLakeSupabaseFields = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  const { ducklakeStorageProjectRef } = form.watch()

  const [showNewBucketDialog, setShowNewBucketDialog] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')

  const { data: organization } = useSelectedOrganizationQuery()
  const { data: sourceProject } = useSelectedProjectQuery()
  const sourceRegion = sourceProject?.region

  const {
    data: projectsData,
    isPending: isLoadingProjects,
    isError: isErrorProjects,
  } = useOrgProjectsInfiniteQuery(
    { slug: organization?.slug, statuses: [PROJECT_STATUS.ACTIVE_HEALTHY] },
    { enabled: !!organization?.slug }
  )

  const projects = useMemo(
    () =>
      (projectsData?.pages.flatMap((page) => page.projects) ?? []).filter(
        (project) => !project.is_branch
      ),
    [projectsData]
  )
  const projectsByRef = useMemo(
    () => new Map(projects.map((project) => [project.ref, project])),
    [projects]
  )

  const regionForRef = (ref?: string) => {
    if (!ref) return undefined
    const region = projectsByRef.get(ref)?.region
    if (region) return region
    return ref === sourceProject?.ref ? sourceProject?.region : undefined
  }

  const projectLabel = (ref?: string) => {
    if (!ref) return undefined
    const project = projectsByRef.get(ref)
    return project ? `${project.name} · ${project.ref}` : ref
  }

  const {
    data: bucketsData,
    isPending: isLoadingBuckets,
    isError: isErrorBuckets,
  } = usePaginatedBucketsQuery(
    { projectRef: ducklakeStorageProjectRef },
    { enabled: !!ducklakeStorageProjectRef }
  )

  const buckets = useMemo(
    () =>
      (bucketsData?.pages.flat() ?? []).filter(
        (bucket) => !bucket.type || bucket.type === 'STANDARD'
      ),
    [bucketsData]
  )

  const { mutateAsync: createBucket, isPending: isCreatingBucket } = useBucketCreateMutation()

  const storageProjectName = ducklakeStorageProjectRef
    ? (projectsByRef.get(ducklakeStorageProjectRef)?.name ?? ducklakeStorageProjectRef)
    : undefined

  const handleCreateBucket = async () => {
    const name = newBucketName.trim()
    if (!name || !ducklakeStorageProjectRef) return
    if (name.includes('/')) {
      return toast.error('Bucket name cannot contain "/"')
    }

    try {
      await createBucket({
        projectRef: ducklakeStorageProjectRef,
        id: name,
        type: 'STANDARD',
        isPublic: false,
      })
      form.setValue('ducklakeStorageBucket', name, { shouldValidate: true, shouldDirty: true })
      setNewBucketName('')
      setShowNewBucketDialog(false)
    } catch {
      // The mutation surfaces the failure through its onError toast
    }
  }

  const renderRegionWarning = (ref?: string) => {
    const region = regionForRef(ref)
    if (!region || !sourceRegion || region === sourceRegion) return null
    return (
      <Admonition
        type="warning"
        className="mb-0"
        description={`This project is in ${region}, a different region than your source project (${sourceRegion}). Cross-region replication can add noticeable latency.`}
      />
    )
  }

  const renderProjectSelect = (
    value: string | undefined,
    onChange: (value: string) => void,
    placeholder: string
  ) => {
    if (isLoadingProjects) {
      return (
        <Button
          disabled
          variant="default"
          className="w-full justify-between"
          size="small"
          iconRight={<Loader2 className="animate-spin" />}
        >
          Retrieving projects
        </Button>
      )
    }
    if (isErrorProjects) {
      return (
        <Button
          disabled
          variant="default"
          className="w-full justify-start"
          size="small"
          icon={<WarningIcon />}
        >
          Failed to retrieve projects
        </Button>
      )
    }
    return (
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger>{projectLabel(value) ?? placeholder}</SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {projects.length === 0 ? (
              <SelectItem value="__no_projects__" disabled>
                No active projects available
              </SelectItem>
            ) : (
              projects.map((project) => (
                <SelectItem key={project.ref} value={project.ref}>
                  <div className="flex flex-col">
                    <span>{project.name}</span>
                    <span className="text-foreground-lighter">
                      {project.ref} · {project.region}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  const renderBucketSelect = (value: string | undefined, onChange: (value: string) => void) => {
    if (!ducklakeStorageProjectRef) {
      return (
        <Button disabled variant="default" className="w-full justify-start" size="small">
          Select a storage project first
        </Button>
      )
    }
    if (isLoadingBuckets) {
      return (
        <Button
          disabled
          variant="default"
          className="w-full justify-between"
          size="small"
          iconRight={<Loader2 className="animate-spin" />}
        >
          Retrieving buckets
        </Button>
      )
    }
    if (isErrorBuckets) {
      return (
        <Button
          disabled
          variant="default"
          className="w-full justify-start"
          size="small"
          icon={<WarningIcon />}
        >
          Failed to retrieve buckets
        </Button>
      )
    }
    return (
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger>{value || 'Select a bucket'}</SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {buckets.length === 0 ? (
              <SelectItem value="__no_buckets__" disabled>
                No buckets available
              </SelectItem>
            ) : (
              buckets.map((bucket) => (
                <SelectItem key={bucket.id} value={bucket.id}>
                  {bucket.name}
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Catalog</p>
        <p className="text-sm text-foreground-light">
          The selected project's Postgres database is used as the PostgreSQL DuckLake catalog.
        </p>
      </div>

      <FormField
        control={form.control}
        name="ducklakeCatalogProjectRef"
        render={({ field }) => (
          <FormItemLayout
            layout="horizontal"
            label="Catalog project"
            description={
              <div className="flex flex-col gap-y-2">
                {renderRegionWarning(field.value)}
                <span>
                  Warehouse connects to this project's Postgres instance to store the DuckLake
                  catalog.
                </span>
              </div>
            }
          >
            <FormControl>
              {renderProjectSelect(field.value, field.onChange, 'Select a project')}
            </FormControl>
          </FormItemLayout>
        )}
      />

      <FormField
        control={form.control}
        name="ducklakePoolSize"
        render={({ field }) => (
          <FormItemLayout
            layout="horizontal"
            label="Pool size"
            description="Optional number of concurrent DuckDB connections to the catalog"
          >
            <FormControl>
              <Input
                type="number"
                min={1}
                max={6}
                value={field.value ?? ''}
                placeholder="Default: 4"
                onChange={(event) =>
                  field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                }
              />
            </FormControl>
          </FormItemLayout>
        )}
      />

      <FormField
        control={form.control}
        name="ducklakeMetadataSchema"
        render={({ field }) => (
          <FormItemLayout
            layout="horizontal"
            label="Metadata schema"
            description="Schema used for DuckLake metadata tables in the catalog's Postgres"
          >
            <FormControl>
              <Input {...field} placeholder="ducklake" value={field.value ?? ''} />
            </FormControl>
          </FormItemLayout>
        )}
      />

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Object storage</p>
        <p className="text-sm text-foreground-light">
          Replicated data files are written to a Storage bucket in the selected project.
        </p>
      </div>

      <FormField
        control={form.control}
        name="ducklakeStorageProjectRef"
        render={({ field }) => (
          <FormItemLayout
            layout="horizontal"
            label="Storage project"
            description={
              <div className="flex flex-col gap-y-2">
                {renderRegionWarning(field.value)}
                <span>The project whose object storage holds the DuckLake data files.</span>
              </div>
            }
          >
            <FormControl>
              {renderProjectSelect(
                field.value,
                (value) => {
                  field.onChange(value)
                  // Buckets are project-scoped, so clear the selection when the project changes
                  form.setValue('ducklakeStorageBucket', '')
                },
                'Select a project'
              )}
            </FormControl>
          </FormItemLayout>
        )}
      />

      <FormField
        control={form.control}
        name="ducklakeStorageBucket"
        render={({ field }) => (
          <FormItemLayout
            layout="horizontal"
            label="Bucket"
            description="The bucket in which DuckLake data files will be stored."
          >
            <div className="flex items-center gap-x-2">
              <div className="grow">
                <FormControl>{renderBucketSelect(field.value, field.onChange)}</FormControl>
              </div>
              <Button
                type="button"
                variant="default"
                icon={<Plus />}
                disabled={!ducklakeStorageProjectRef}
                onClick={() => setShowNewBucketDialog(true)}
              >
                New bucket
              </Button>
            </div>
          </FormItemLayout>
        )}
      />

      <Dialog open={showNewBucketDialog} onOpenChange={setShowNewBucketDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new bucket</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection className="flex flex-col gap-y-2">
            <label htmlFor="ducklake-new-bucket-name" className="text-sm text-foreground-light">
              Bucket name
            </label>
            <Input
              id="ducklake-new-bucket-name"
              value={newBucketName}
              placeholder="ducklake-data"
              onChange={(event) => setNewBucketName(event.target.value)}
            />
            <p className="text-xs text-foreground-lighter">
              A private Standard bucket will be created in{' '}
              {storageProjectName ?? 'the selected project'}.
            </p>
          </DialogSection>
          <DialogFooter>
            <Button
              type="button"
              variant="default"
              disabled={isCreatingBucket}
              onClick={() => setShowNewBucketDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={isCreatingBucket}
              disabled={!newBucketName.trim()}
              onClick={handleCreateBucket}
            >
              Create bucket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const DuckLakeCustomFields = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  const [showCatalogUrl, setShowCatalogUrl] = useState(false)
  const [showSecretAccessKey, setShowSecretAccessKey] = useState(false)

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Catalog</p>
        <p className="text-sm text-foreground-light">
          Configure the PostgreSQL-backed DuckLake catalog and the S3-compatible storage location
          for replicated data.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="ducklakeCatalogUrl"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Catalog URL"
              description="A PostgreSQL connection string for the DuckLake catalog"
            >
              <FormControl>
                <PasswordInput
                  value={field.value ?? ''}
                  type={showCatalogUrl ? 'text' : 'password'}
                  placeholder="postgres://user:pass@host:5432/ducklake_catalog"
                  onChange={(event) => field.onChange(event.target.value)}
                  actions={
                    <div className="flex items-center justify-center">
                      <Button
                        variant="default"
                        className="w-7"
                        icon={showCatalogUrl ? <Eye /> : <EyeOff />}
                        onClick={() => setShowCatalogUrl(!showCatalogUrl)}
                      />
                    </div>
                  }
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeDataPath"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Data path"
              description="An S3 path where DuckLake data files will be written"
            >
              <FormControl>
                <Input {...field} placeholder="s3://bucket/path" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakePoolSize"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Pool size"
              description="Optional number of concurrent DuckDB connections to use"
            >
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={field.value ?? ''}
                  placeholder="Default: 4"
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === '' ? undefined : Number(event.target.value)
                    )
                  }
                />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Object storage</p>
        <p className="text-sm text-foreground-light">
          Optional credentials and endpoint settings for S3-compatible storage providers.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="ducklakeS3AccessKeyId"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 Access Key ID"
              description="Required access key ID for the object storage provider"
            >
              <FormControl>
                <Input {...field} placeholder="my-access-key" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3SecretAccessKey"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 Secret Access Key"
              description="Required secret access key for the object storage provider"
              className="relative"
            >
              <FormControl>
                <Input
                  {...field}
                  type={showSecretAccessKey ? 'text' : 'password'}
                  placeholder="my-secret-key"
                  value={field.value ?? ''}
                />
              </FormControl>
              <Button
                variant="default"
                icon={showSecretAccessKey ? <Eye /> : <EyeOff />}
                className="w-7 absolute right-6 top-[4px]"
                onClick={() => setShowSecretAccessKey(!showSecretAccessKey)}
              />
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3Region"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 Region"
              description="Required region for the object storage provider"
            >
              <FormControl>
                <Input {...field} placeholder="us-east-1" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3Endpoint"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 Endpoint"
              description="Required endpoint without the protocol scheme, for example `127.0.0.1:5000/s3`"
            >
              <FormControl>
                <Input {...field} placeholder="127.0.0.1:5000/s3" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3UrlStyle"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 URL style"
              description="Choose `path` for MinIO/Supabase-style endpoints or `vhost` for AWS-style virtual host addressing"
            >
              <FormControl>
                <Select value={field.value ?? 'path'} onValueChange={field.onChange}>
                  <SelectTrigger>{field.value ?? 'path'}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="path">path</SelectItem>
                    <SelectItem value="vhost">vhost</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3UseSsl"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Use SSL"
              description="Whether to use SSL when connecting to the S3-compatible endpoint"
            >
              <FormControl>
                <Select
                  value={field.value === false ? 'false' : 'true'}
                  onValueChange={(value) => field.onChange(value === 'true')}
                >
                  <SelectTrigger>{field.value === false ? 'false' : 'true'}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Metadata</p>
        <p className="text-sm text-foreground-light">
          Optional schema setting for DuckLake metadata tables.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="ducklakeMetadataSchema"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Metadata schema"
              description="Schema used for DuckLake metadata tables in PostgreSQL"
            >
              <FormControl>
                <Input {...field} placeholder="ducklake" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>
    </div>
  )
}

export const DuckLakeFields = ({
  form,
  editMode,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
}) => {
  const ducklakeMode = (form.watch('ducklakeMode') ?? DUCKLAKE_MODE_SUPABASE) as DucklakeMode
  // The platform API resolves "Use Supabase" config into a flat catalog URL + provisioned S3
  // credentials before persisting, so an existing destination can only be edited as custom
  // parameters — the original project selections aren't recoverable.
  const effectiveMode = editMode ? DUCKLAKE_MODE_CUSTOM : ducklakeMode

  return (
    <div className="flex flex-col gap-y-6 p-5">
      <p className="text-sm font-medium text-foreground">DuckLake settings</p>

      {!editMode && (
        <div className="flex flex-col gap-y-3">
          <p className="text-xs uppercase tracking-wider text-foreground-lighter">
            How should this DuckLake be configured?
          </p>
          <DuckLakeModeSelector
            value={effectiveMode}
            onChange={(value) =>
              form.setValue('ducklakeMode', value, { shouldValidate: true, shouldDirty: true })
            }
          />
        </div>
      )}

      {effectiveMode === DUCKLAKE_MODE_SUPABASE ? (
        <DuckLakeSupabaseFields form={form} />
      ) : (
        <DuckLakeCustomFields form={form} />
      )}
    </div>
  )
}

export const SnowflakeFields = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  const [showPrivateKeyPassphrase, setShowPrivateKeyPassphrase] = useState(false)

  return (
    <div className="flex flex-col gap-y-6 p-5">
      <p className="text-sm font-medium text-foreground">Snowflake settings</p>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Connection</p>
        <p className="text-sm text-foreground-light">
          Configure the Snowflake account, user, and target namespace for replicated data.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="snowflakeAccountId"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Account ID"
              description="Snowflake account identifier, for example ORGNAME-ACCOUNTNAME"
            >
              <FormControl>
                <Input {...field} placeholder="MYORG-MYACCOUNT" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="snowflakeUser"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="User"
              description="Snowflake user configured for key-pair authentication"
            >
              <FormControl>
                <Input {...field} placeholder="ETL_USER" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="snowflakeDatabase"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Database"
              description="Snowflake database where replicated tables will be created"
            >
              <FormControl>
                <Input {...field} placeholder="ANALYTICS" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="snowflakeSchema"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Schema"
              description="Snowflake schema where replicated tables will be created"
            >
              <FormControl>
                <Input {...field} placeholder="PUBLIC" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="snowflakeRole"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Role"
              description="Optional Snowflake role to assume after connecting"
            >
              <FormControl>
                <Input {...field} placeholder="ETL_ROLE" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Authentication</p>
        <p className="text-sm text-foreground-light">
          Use the RSA private key whose public key is registered on the Snowflake user.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="snowflakePrivateKey"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Private key"
              description="RSA private key PEM contents in PKCS#8 or PKCS#1 format"
            >
              <FormControl>
                <TextArea
                  {...field}
                  rows={8}
                  maxLength={10000}
                  placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
                  value={field.value ?? ''}
                  className="font-mono text-xs"
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="snowflakePrivateKeyPassphrase"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Private key passphrase"
              description="Optional passphrase for encrypted private keys"
            >
              <FormControl>
                <PasswordInput
                  value={field.value ?? ''}
                  type={showPrivateKeyPassphrase ? 'text' : 'password'}
                  placeholder="Optional"
                  onChange={(event) => field.onChange(event.target.value)}
                  actions={
                    <div className="flex items-center justify-center">
                      <Button
                        variant="default"
                        className="w-7"
                        icon={showPrivateKeyPassphrase ? <Eye /> : <EyeOff />}
                        onClick={() => setShowPrivateKeyPassphrase(!showPrivateKeyPassphrase)}
                      />
                    </div>
                  }
                />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>
    </div>
  )
}

/**
 * [Joshen] JFYI I'd foresee a possible UX friction point here regarding S3 access key IDs and secret access keys
 * - We'd allow users to select access key IDs via a dropdown here, but require a text input for secret access keys
 * - Chances are most users wouldn't have the corresponding secret access key for the selected key ID at the top of their heads
 * - So highly likely may have to default to "Create a new key" -> which from here they won't know the secret access key thereafter
 * - And it'll end up just creating more keys for each destination
 * Ideal scenario: Just select an access key ID, we then apply the secret access key in the PATCH request, so FE has no
 * context of the secret access key at any point
 */
export const AnalyticsBucketFields = ({
  form,
  setIsFormInteracting,
  onSelectNewBucket,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  setIsFormInteracting: (value: boolean) => void
  onSelectNewBucket: () => void
}) => {
  const { warehouseName, s3AccessKeyId, namespace } = form.watch()
  const [showCatalogToken, setShowCatalogToken] = useState(false)
  const [showSecretAccessKey, setShowSecretAccessKey] = useState(false)

  const { ref: projectRef } = useParams()

  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeysData } = useAPIKeys(
    { projectRef, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { serviceKey } = apiKeysData ?? {}
  const serviceApiKey = serviceKey?.api_key ?? ''

  const {
    data: keysData,
    isSuccess: isSuccessKeys,
    isPending: isLoadingKeys,
    isError: isErrorKeys,
  } = useStorageCredentialsQuery({ projectRef })
  const s3Keys = keysData?.data ?? []
  const keyNoLongerExists =
    (s3AccessKeyId ?? '').length > 0 &&
    s3AccessKeyId !== CREATE_NEW_KEY &&
    !s3Keys.find((k) => k.access_key === s3AccessKeyId)

  const {
    data: analyticsBuckets = [],
    isPending: isLoadingBuckets,
    isError: isErrorBuckets,
  } = useAnalyticsBucketsQuery({ projectRef })

  const canSelectNamespace = !!warehouseName && !!serviceApiKey

  const {
    data: namespaces = [],
    isPending: isLoadingNamespaces,
    isError: isErrorNamespaces,
  } = useIcebergNamespacesQuery(
    { projectRef, warehouse: warehouseName },
    { enabled: !!serviceApiKey }
  )

  return (
    <div className="flex flex-col gap-y-6 p-5">
      <p className="text-sm font-medium text-foreground">Analytics Bucket settings</p>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="warehouseName"
          render={({ field }) => (
            <FormItemLayout
              label="Bucket"
              layout="horizontal"
              description="The Analytics Bucket where data will be stored"
            >
              {isLoadingBuckets ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-between"
                  size="small"
                  iconRight={<Loader2 className="animate-spin" />}
                >
                  Retrieving buckets
                </Button>
              ) : isErrorBuckets ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-start"
                  size="small"
                  icon={<WarningIcon />}
                >
                  Failed to retrieve buckets
                </Button>
              ) : (
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value === 'new-bucket') {
                        onSelectNewBucket()
                      } else {
                        setIsFormInteracting(true)
                        field.onChange(value)
                        // [Joshen] Ideally should select the first namespace of the selected bucket
                        form.setValue('namespace', '')
                      }
                    }}
                  >
                    <SelectTrigger>{field.value || 'Select a bucket'}</SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {analyticsBuckets.length === 0 ? (
                          <SelectItem value="__no_buckets__" disabled>
                            No buckets available
                          </SelectItem>
                        ) : (
                          analyticsBuckets.map((bucket) => (
                            <SelectItem key={bucket.name} value={bucket.name}>
                              {bucket.name}
                            </SelectItem>
                          ))
                        )}
                        <SelectSeparator />
                        <SelectItem value="new-bucket">Create a new bucket</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
              )}
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="namespace"
          render={({ field }) => (
            <FormItemLayout
              label="Namespace"
              layout="horizontal"
              description="The namespace within the bucket where tables will be organized"
            >
              {isLoadingNamespaces && canSelectNamespace ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-between"
                  size="small"
                  iconRight={<Loader2 className="animate-spin" />}
                >
                  Retrieving namespaces
                </Button>
              ) : isErrorNamespaces ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-start"
                  size="small"
                  icon={<WarningIcon />}
                >
                  Failed to retrieve namespaces
                </Button>
              ) : (
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      setIsFormInteracting(true)
                      field.onChange(value)
                    }}
                    disabled={!canSelectNamespace}
                  >
                    <SelectTrigger>
                      {!canSelectNamespace
                        ? 'Select a warehouse first'
                        : field.value === CREATE_NEW_NAMESPACE
                          ? 'Create a new namespace'
                          : field.value || 'Select a namespace'}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {namespaces.length === 0 ? (
                          <SelectItem value="__no_namespaces__" disabled>
                            No namespaces available
                          </SelectItem>
                        ) : (
                          namespaces.map((namespace) => (
                            <SelectItem key={namespace} value={namespace}>
                              {namespace}
                            </SelectItem>
                          ))
                        )}
                        <SelectSeparator />
                        <SelectItem key={CREATE_NEW_NAMESPACE} value={CREATE_NEW_NAMESPACE}>
                          Create a new namespace
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
              )}
            </FormItemLayout>
          )}
        />

        {namespace === CREATE_NEW_NAMESPACE && (
          <FormField
            control={form.control}
            name="newNamespaceName"
            render={({ field }) => (
              <FormItemLayout
                label="New Namespace Name"
                layout="horizontal"
                description="A unique name for the new namespace"
              >
                <FormControl>
                  <Input {...field} placeholder="new_namespace" value={field.value || ''} />
                </FormControl>
              </FormItemLayout>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="catalogToken"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Catalog Token"
              description={
                <>
                  Automatically retrieved from your project's{' '}
                  <InlineLink href={`/project/${projectRef}/settings/api-keys`}>
                    service role key
                  </InlineLink>
                </>
              }
            >
              <PasswordInput
                disabled
                value={field.value}
                type={showCatalogToken ? 'text' : 'password'}
                placeholder="Auto-populated"
                actions={
                  serviceApiKey ? (
                    <div className="flex items-center justify-center">
                      <Button
                        variant="default"
                        className="w-7"
                        icon={showCatalogToken ? <Eye /> : <EyeOff />}
                        onClick={() => setShowCatalogToken(!showCatalogToken)}
                      />
                    </div>
                  ) : null
                }
              />
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="s3AccessKeyId"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 Access Key ID"
              description={
                <div className="flex flex-col gap-y-2">
                  <p>
                    Access keys are managed in your Storage{' '}
                    <InlineLink href={`/project/${projectRef}/storage/s3`}>S3 settings</InlineLink>
                  </p>

                  {isSuccessKeys && keyNoLongerExists && (
                    <Admonition
                      type="warning"
                      title="Unable to find access key ID in project"
                      description={
                        <>
                          Please select another key or create a new set, as this destination will
                          not work otherwise. S3 access keys can be managed in your{' '}
                          <InlineLink href={`/project/${projectRef}/storage/files/settings`}>
                            storage settings
                          </InlineLink>
                          .
                        </>
                      }
                    />
                  )}

                  {s3AccessKeyId === CREATE_NEW_KEY && (
                    <Admonition
                      type="default"
                      description="A new set of S3 access keys will be created."
                    />
                  )}
                </div>
              }
            >
              {isLoadingKeys ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-between"
                  size="small"
                  iconRight={<Loader2 className="animate-spin" />}
                >
                  Retrieving keys
                </Button>
              ) : isErrorKeys ? (
                <Button
                  disabled
                  variant="default"
                  className="w-full justify-start"
                  size="small"
                  icon={<WarningIcon />}
                >
                  Failed to retrieve keys
                </Button>
              ) : (
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      {field.value === CREATE_NEW_KEY
                        ? 'Create a new key'
                        : (field.value ?? '').length === 0
                          ? 'Select an access key ID'
                          : field.value}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {s3Keys.map((key) => (
                          <SelectItem key={key.id} value={key.access_key}>
                            {key.access_key}
                            <p className="text-foreground-lighter">{key.description}</p>
                          </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem key={CREATE_NEW_KEY} value={CREATE_NEW_KEY}>
                          Create a new key
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
              )}
            </FormItemLayout>
          )}
        />

        {s3AccessKeyId !== CREATE_NEW_KEY && (
          <FormField
            control={form.control}
            name="s3SecretAccessKey"
            render={({ field }) => (
              <FormItemLayout
                layout="horizontal"
                label="S3 Secret Access Key"
                className="relative"
                description="The secret key corresponding to your selected access key ID."
              >
                <FormControl>
                  <Input
                    {...field}
                    type={showSecretAccessKey ? 'text' : 'password'}
                    value={field.value ?? ''}
                    placeholder="Provide the secret access key"
                  />
                </FormControl>
                <Button
                  variant="default"
                  icon={showSecretAccessKey ? <Eye /> : <EyeOff />}
                  className="w-7 absolute right-1 top-[4px]"
                  onClick={() => setShowSecretAccessKey(!showSecretAccessKey)}
                />
              </FormItemLayout>
            )}
          />
        )}
      </div>
    </div>
  )
}
