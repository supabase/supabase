import { Check, Eye, EyeOff, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  ComboboxTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  FormControl,
  FormField,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroupStacked,
  RadioGroupStackedItem,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SelectionListState } from 'ui-patterns/SelectionListState'

import { STORED_SECRET_PLACEHOLDER } from '../DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import {
  DUCKLAKE_BUCKET_FIELD_COPY,
  DUCKLAKE_CATALOG_PROJECT_FIELD_COPY,
  DUCKLAKE_CATALOG_URL_FIELD_COPY,
  DUCKLAKE_DATA_PATH_FIELD_COPY,
  DUCKLAKE_STORAGE_PROJECT_FIELD_COPY,
} from '../DestinationFormFieldCopy'
import {
  isMetadataListErrorVisible,
  isMetadataListLoading,
  useRefreshOnOpen,
} from '../useRefreshOnOpen'
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
    label: 'Select Supabase projects',
    description:
      'Choose projects for the Postgres catalog and Storage bucket. They can be the same project; Pipelines creates credentials.',
  },
  {
    value: DUCKLAKE_MODE_CUSTOM,
    label: 'Enter connection details',
    description:
      'Provide a Postgres catalog URL and S3-compatible storage details and credentials.',
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
    <RadioGroupStacked
      aria-label="Configuration method"
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as DucklakeMode)}
    >
      {DUCKLAKE_MODE_OPTIONS.map((option) => (
        <RadioGroupStackedItem
          key={option.value}
          value={option.value}
          label={option.label}
          description={option.description}
        />
      ))}
    </RadioGroupStacked>
  )
}

const DuckLakeSupabaseFields = ({ form }: { form: UseFormReturn<DestinationPanelSchemaType> }) => {
  const ducklakeStorageProjectRef = useWatch({
    control: form.control,
    name: 'ducklakeStorageProjectRef',
  })

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
  const storageProjectName =
    projectsByRef.get(ducklakeStorageProjectRef ?? '')?.name ??
    (ducklakeStorageProjectRef === sourceProject?.ref
      ? sourceProject?.name
      : ducklakeStorageProjectRef)

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
      return toast.error('Bucket name cannot contain "/".')
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
          DuckLake metadata is stored in the selected project’s Postgres database.
        </p>
      </div>

      <FormField
        control={form.control}
        name="ducklakeCatalogProjectRef"
        render={({ field }) => (
          <FormItemLayout
            layout="horizontal"
            label={DUCKLAKE_CATALOG_PROJECT_FIELD_COPY.label}
            description={
              <div className="flex flex-col gap-y-2">
                {renderRegionWarning(field.value)}
                <span>{DUCKLAKE_CATALOG_PROJECT_FIELD_COPY.description}</span>
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
        name="ducklakeMetadataSchema"
        render={({ field }) => (
          <FormItemLayout
            layout="horizontal"
            label="Metadata schema"
            description="New schema where DuckLake metadata will be stored."
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
            label={DUCKLAKE_STORAGE_PROJECT_FIELD_COPY.label}
            description={
              <div className="flex flex-col gap-y-2">
                {renderRegionWarning(field.value)}
                <span>{DUCKLAKE_STORAGE_PROJECT_FIELD_COPY.description}</span>
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
            label={DUCKLAKE_BUCKET_FIELD_COPY.label}
            description={DUCKLAKE_BUCKET_FIELD_COPY.description}
          >
            <FormControl>
              <BucketSelection
                form={form}
                value={field.value}
                onChange={field.onChange}
                onCreateBucket={() => setShowNewBucketDialog(true)}
              />
            </FormControl>
          </FormItemLayout>
        )}
      />

      <Dialog open={showNewBucketDialog} onOpenChange={setShowNewBucketDialog}>
        <DialogContent size="small">
          <DialogHeader>
            <DialogTitle>New bucket</DialogTitle>
            <DialogDescription>
              Creates a private bucket in the selected Storage project ({storageProjectName}).
            </DialogDescription>
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
              disabled={isCreatingBucket}
              onClick={() => setShowNewBucketDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
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
          Configure the Postgres DuckLake catalog and S3-compatible storage for replicated data.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="ducklakeCatalogUrl"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={DUCKLAKE_CATALOG_URL_FIELD_COPY.label}
              description={
                editMode
                  ? DUCKLAKE_CATALOG_URL_FIELD_COPY.editDescription
                  : DUCKLAKE_CATALOG_URL_FIELD_COPY.createDescription
              }
            >
              <FormControl>
                <PasswordInput
                  value={field.value ?? ''}
                  type={showCatalogUrl && !editMode ? 'text' : 'password'}
                  placeholder={
                    editMode
                      ? STORED_SECRET_PLACEHOLDER
                      : 'postgresql://user:password@host:5432/database'
                  }
                  onChange={(event) => field.onChange(event.target.value)}
                  actions={
                    !editMode && (
                      <div className="flex items-center justify-center">
                        <Button
                          className="w-7"
                          aria-label={showCatalogUrl ? 'Hide catalog URL' : 'Show catalog URL'}
                          icon={showCatalogUrl ? <Eye /> : <EyeOff />}
                          onClick={() => setShowCatalogUrl(!showCatalogUrl)}
                        />
                      </div>
                    )
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
              label={DUCKLAKE_DATA_PATH_FIELD_COPY.label}
              description={DUCKLAKE_DATA_PATH_FIELD_COPY.description}
            >
              <FormControl>
                <Input {...field} placeholder="s3://bucket/path" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Object storage</p>
        <p className="text-sm text-foreground-light">
          Connection settings and credentials for your S3-compatible object storage.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="ducklakeS3AccessKeyId"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 access key ID"
              description={
                editMode
                  ? 'Stored access key ID is hidden. Enter a new key ID to replace it.'
                  : 'Required access key ID for the object storage provider.'
              }
            >
              <FormControl>
                <Input
                  {...field}
                  placeholder={editMode ? STORED_SECRET_PLACEHOLDER : undefined}
                  value={field.value ?? ''}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  data-bwignore
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
              label="S3 secret access key"
              description={
                editMode
                  ? 'Stored secret access key is hidden. Enter a new secret to replace it.'
                  : 'Required secret access key for the object storage provider.'
              }
            >
              <FormControl>
                <PasswordInput
                  {...field}
                  type={showSecretAccessKey && !editMode ? 'text' : 'password'}
                  placeholder={editMode ? STORED_SECRET_PLACEHOLDER : undefined}
                  value={field.value ?? ''}
                  autoComplete="off"
                  actions={
                    !editMode && (
                      <Button
                        className="w-7"
                        aria-label={
                          showSecretAccessKey
                            ? 'Hide S3 secret access key'
                            : 'Show S3 secret access key'
                        }
                        icon={showSecretAccessKey ? <Eye /> : <EyeOff />}
                        onClick={() => setShowSecretAccessKey(!showSecretAccessKey)}
                      />
                    )
                  }
                />
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
              label="S3 endpoint"
              description="Public address of your storage provider, without the HTTP or HTTPS prefix."
            >
              <FormControl>
                <Input
                  {...field}
                  placeholder="s3.us-east-1.amazonaws.com"
                  value={field.value ?? ''}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3Region"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 region"
              description="Required region for the object storage provider."
            >
              <FormControl>
                <Input {...field} placeholder="us-east-1" value={field.value ?? ''} />
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
              description="Controls where the bucket name appears in requests to your storage provider."
            >
              <FormControl>
                <Select value={field.value ?? 'path'} onValueChange={field.onChange}>
                  <SelectTrigger>
                    {field.value === 'vhost' ? 'Virtual-host style' : 'Path style'}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="path" className="[&>span]:top-2.5">
                      <p>Path style</p>
                      <p className="text-foreground-lighter">
                        Bucket name appears in the URL path.
                      </p>
                    </SelectItem>
                    <SelectItem value="vhost" className="[&>span]:top-2.5">
                      <p>Virtual-host style</p>
                      <p className="text-foreground-lighter">
                        Bucket name appears in the hostname.
                      </p>
                    </SelectItem>
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
              description="Controls whether connections to your storage provider use HTTPS."
            >
              <FormControl>
                <Select
                  value={field.value === false ? 'false' : 'true'}
                  onValueChange={(value) => field.onChange(value === 'true')}
                >
                  <SelectTrigger>{field.value === false ? 'Off' : 'On'}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="[&>span]:top-2.5">
                      <p>On</p>
                      <p className="text-foreground-lighter">Encrypts the connection with HTTPS.</p>
                    </SelectItem>
                    <SelectItem value="false" className="[&>span]:top-2.5">
                      <p>Off</p>
                      <p className="text-foreground-lighter">
                        Uses HTTP if your provider requires it.
                      </p>
                    </SelectItem>
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
              description={
                editMode
                  ? 'Schema containing this destination’s DuckLake metadata tables.'
                  : 'New schema where DuckLake metadata will be stored.'
              }
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
  const ducklakeMode = (useWatch({ control: form.control, name: 'ducklakeMode' }) ??
    DUCKLAKE_MODE_SUPABASE) as DucklakeMode
  // The platform API resolves "Use Supabase" config into a flat catalog URL + provisioned S3
  // credentials before persisting, so an existing destination can only be edited as custom
  // parameters — the original project selections aren't recoverable.
  const effectiveMode = editMode ? DUCKLAKE_MODE_CUSTOM : ducklakeMode

  return (
    <div className="flex flex-col gap-y-6 p-5">
      {editMode ? (
        <p className="text-sm font-medium text-foreground">DuckLake settings</p>
      ) : (
        <FormItemLayout layout="horizontal" label="Configuration method">
          <FormControl>
            <DuckLakeModeSelector
              value={effectiveMode}
              onChange={(value) =>
                form.setValue('ducklakeMode', value, { shouldValidate: true, shouldDirty: true })
              }
            />
          </FormControl>
        </FormItemLayout>
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
    isPending: isPendingProjects,
    isFetching: isFetchingProjects,
    isError: isErrorProjects,
    refetch: refetchProjects,
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
  const isProjectsErrorVisible = isMetadataListErrorVisible(isErrorProjects, projects.length)

  const projectsByRef = useMemo(
    () => new Map(projects.map((project) => [project.ref, project])),
    [projects]
  )

  const projectLabel = (ref?: string) => {
    if (!ref) return undefined
    const project = projectsByRef.get(ref)
    return project ? `${project.name} · ${project.ref}` : ref
  }
  const { handleOpenChange: handleRefreshProjectsOnOpen } = useRefreshOnOpen({
    isEnabled: !!organization?.slug,
    refetch: refetchProjects,
  })

  return (
    <Select value={value || ''} onValueChange={onChange} onOpenChange={handleRefreshProjectsOnOpen}>
      <SelectTrigger>{projectLabel(value) ?? placeholder}</SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectionListState
            isLoading={isMetadataListLoading(
              isPendingProjects || isFetchingProjects,
              projects.length
            )}
            isError={isProjectsErrorVisible}
            isEmpty={
              !isMetadataListLoading(isPendingProjects || isFetchingProjects, projects.length) &&
              !isProjectsErrorVisible &&
              projects.length === 0
            }
            emptyLabel="No active projects available"
            errorLabel="Unable to load projects"
          />
          {projects.map((project) => (
            <SelectItem key={project.ref} value={project.ref}>
              <div className="flex flex-col">
                <span>{project.name}</span>
                <span className="text-foreground-lighter">
                  {project.ref} · {project.region}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

const BucketSelection = ({
  form,
  value,
  onChange,
  onCreateBucket,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  value: string | undefined
  onChange: (value: string) => void
  onCreateBucket: () => void
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const ducklakeStorageProjectRef = useWatch({
    control: form.control,
    name: 'ducklakeStorageProjectRef',
  })

  const {
    data: bucketsData,
    isPending: isPendingBuckets,
    isFetching: isFetchingBuckets,
    isError: isErrorBuckets,
    refetch: refetchBuckets,
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
  const isBucketsErrorVisible = isMetadataListErrorVisible(isErrorBuckets, buckets.length)
  const isBucketsLoading = isMetadataListLoading(
    isPendingBuckets || isFetchingBuckets,
    buckets.length
  )
  const { handleOpenChange: handleRefreshBucketsOnOpen } = useRefreshOnOpen({
    isEnabled: !!ducklakeStorageProjectRef,
    refetch: refetchBuckets,
  })

  if (!ducklakeStorageProjectRef) {
    return (
      <ComboboxTrigger size="small" disabled>
        Select a storage project first
      </ComboboxTrigger>
    )
  }

  return (
    <Popover
      modal={false}
      open={isDropdownOpen}
      onOpenChange={(open) => {
        setIsDropdownOpen(open)
        handleRefreshBucketsOnOpen(open)
        if (!open) setSearchTerm('')
      }}
    >
      <PopoverTrigger asChild>
        <ComboboxTrigger
          size="small"
          aria-expanded={isDropdownOpen}
          data-state={isDropdownOpen ? 'open' : 'closed'}
          className={cn(!value && 'text-foreground-muted')}
        >
          {value || 'Select a bucket'}
        </ComboboxTrigger>
      </PopoverTrigger>
      <PopoverContent sameWidthAsTrigger className="p-0" align="start" side="bottom">
        <Command>
          <CommandInput
            placeholder="Find bucket..."
            className="text-xs"
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {!isBucketsLoading && !isBucketsErrorVisible && buckets.length > 0 && (
              <CommandEmpty>No buckets found</CommandEmpty>
            )}
            <SelectionListState
              isLoading={isBucketsLoading}
              isError={isBucketsErrorVisible}
              isEmpty={!isBucketsLoading && !isBucketsErrorVisible && buckets.length === 0}
              emptyLabel="No buckets available"
              errorLabel="Unable to load buckets"
              skeletonVariant="command"
            />
            {buckets.length > 0 && (
              <CommandGroup>
                <ScrollArea
                  className={buckets.length > 7 ? 'h-[210px]' : ''}
                  onWheel={(event) => event.stopPropagation()}
                >
                  {buckets.map((bucket) => (
                    <CommandItem
                      key={bucket.id}
                      value={bucket.name}
                      className="cursor-pointer flex items-center justify-between gap-x-2 w-full"
                      onSelect={() => {
                        onChange(bucket.id)
                        setIsDropdownOpen(false)
                      }}
                    >
                      <span>{bucket.name}</span>
                      {value === bucket.id && (
                        <Check className="text-primary" strokeWidth={2} size={13} />
                      )}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup forceMount>
              <CommandItem
                forceMount
                className="cursor-pointer w-full"
                onSelect={() => {
                  setIsDropdownOpen(false)
                  onCreateBucket()
                }}
              >
                <Plus size={14} strokeWidth={1.5} className="mr-2" />
                New bucket
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
