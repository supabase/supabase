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
  SelectTrigger,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { STORED_SECRET_PLACEHOLDER } from '../DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import {
  DUCKLAKE_MODE_CUSTOM,
  DUCKLAKE_MODE_SUPABASE,
  type DucklakeMode,
} from './DuckLake.constants'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useBucketCreateMutation } from '@/data/storage/bucket-create-mutation'
import { usePaginatedBucketsQuery } from '@/data/storage/buckets-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

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

  const { data: projectsData } = useOrgProjectsInfiniteQuery(
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

  const { mutate: createBucket, isPending: isCreatingBucket } = useBucketCreateMutation({
    onSuccess: (_, vars) => {
      form.setValue('ducklakeStorageBucket', vars.id)
      setNewBucketName('')
      setShowNewBucketDialog(false)
    },
  })

  const handleCreateBucket = async () => {
    const name = newBucketName.trim()
    if (!name || !ducklakeStorageProjectRef) return
    if (name.includes('/')) {
      return toast.error('Bucket name cannot contain "/"')
    }

    createBucket({
      projectRef: ducklakeStorageProjectRef,
      id: name,
      type: 'STANDARD',
      isPublic: false,
    })
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

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Catalog</p>
        <p className="text-sm text-foreground-light">
          The selected project's Postgres database is used as the PostgreSQL DuckLake catalog
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
                  catalog
                </span>
              </div>
            }
          >
            <FormControl>
              <ProjectSelection
                value={field.value}
                onChange={field.onChange}
                placeholder="Select a project"
              />
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
            description="Number of concurrent DuckDB connections to the catalog"
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
                <span>The project whose object storage holds the DuckLake data files</span>
              </div>
            }
          >
            <FormControl>
              <ProjectSelection
                value={field.value}
                onChange={(value) => {
                  field.onChange(value)
                  // Buckets are project-scoped, so clear the selection when the project changes
                  form.setValue('ducklakeStorageBucket', '')
                }}
                placeholder="Select a project"
              />
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
                <FormControl>
                  <BucketSelection form={form} value={field.value} onChange={field.onChange} />
                </FormControl>
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
            <DialogTitle>Create a new file bucket</DialogTitle>
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

const DuckLakeCustomFields = ({
  form,
  editMode,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
}) => {
  const [showCatalogUrl, setShowCatalogUrl] = useState(false)
  const [showSecretAccessKey, setShowSecretAccessKey] = useState(false)

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Catalog</p>
        <p className="text-sm text-foreground-light">
          Configure the PostgreSQL DuckLake catalog and S3-compatible storage for replicated data
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
              description={
                editMode
                  ? 'Stored catalog URL is hidden. Enter a new URL to replace it.'
                  : 'A PostgreSQL connection string for the DuckLake catalog'
              }
            >
              <FormControl>
                <PasswordInput
                  value={field.value ?? ''}
                  type={showCatalogUrl ? 'text' : 'password'}
                  placeholder={
                    editMode
                      ? STORED_SECRET_PLACEHOLDER
                      : 'postgres://user:pass@host:5432/ducklake_catalog'
                  }
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
              description="Number of concurrent DuckDB connections to use"
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
              description={
                editMode
                  ? 'Stored access key ID is hidden. Enter a new key ID to replace it.'
                  : 'Required access key ID for the object storage provider'
              }
            >
              <FormControl>
                <Input
                  {...field}
                  placeholder={editMode ? STORED_SECRET_PLACEHOLDER : 'my-access-key'}
                  value={field.value ?? ''}
                />
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
              description={
                editMode
                  ? 'Stored secret access key is hidden. Enter a new secret to replace it.'
                  : 'Required secret access key for the object storage provider'
              }
              className="relative"
            >
              <FormControl>
                <Input
                  {...field}
                  type={showSecretAccessKey ? 'text' : 'password'}
                  placeholder={editMode ? STORED_SECRET_PLACEHOLDER : 'my-secret-key'}
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
        <DuckLakeCustomFields form={form} editMode={editMode} />
      )}
    </div>
  )
}

const ProjectSelection = ({
  value,
  onChange,
  placeholder,
}: {
  value: string | undefined
  onChange: (value: string) => void
  placeholder: string
}) => {
  const { data: organization } = useSelectedOrganizationQuery()

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

  const projectLabel = (ref?: string) => {
    if (!ref) return undefined
    const project = projectsByRef.get(ref)
    return project ? `${project.name} · ${project.ref}` : ref
  }

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

const BucketSelection = ({
  form,
  value,
  onChange,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  value: string | undefined
  onChange: (value: string) => void
}) => {
  const { ducklakeStorageProjectRef } = form.watch()

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
    <Select
      value={value || ''}
      onValueChange={(e) => {
        if (e) onChange(e)
      }}
    >
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
