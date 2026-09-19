import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronsUpDown } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Button, Card, CardContent, Form, FormControl, FormField } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import { getWarehouseDestinationProjectRef } from './Warehouse.utils'
import { WarehouseSchemaTablePicker } from './WarehouseSchemaTablePicker'
import { AlertError } from '@/components/ui/AlertError'
import { OrganizationProjectSelector } from '@/components/ui/OrganizationProjectSelector'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import type { WarehouseSetupBody } from '@/data/warehouse/warehouse-setup-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import { WAREHOUSE_PUBLICATION_NAME } from '@/lib/warehouse'
import type { ResponseError } from '@/types'

const FormSchema = z.object({
  destinationProject: z.object({
    ref: z.string().min(1, 'Select a project'),
    name: z.string(),
  }),
})
type FormValues = z.infer<typeof FormSchema>

interface WarehouseSetupFormProps {
  onSubmit: (body: WarehouseSetupBody) => void
  isSubmitting: boolean
  error?: ResponseError | null
}

export const WarehouseSetupForm = (props: WarehouseSetupFormProps) => {
  const {
    data: project,
    isPending: isProjectPending,
    error: projectError,
  } = useSelectedProjectQuery()
  const {
    data: organization,
    isPending: isOrganizationPending,
    error: organizationError,
  } = useSelectedOrganizationQuery()
  const {
    data,
    isPending: isDestinationsPending,
    error: destinationsError,
  } = useReplicationDestinationsQuery(
    { projectRef: project?.ref },
    { retry: false, refetchOnMount: 'always' }
  )

  if (projectError) return <AlertError subject="Failed to load project" error={projectError} />
  if (organizationError)
    return <AlertError subject="Failed to load organization" error={organizationError} />
  if (isProjectPending || isOrganizationPending || isDestinationsPending)
    return <GenericSkeletonLoader />
  if (destinationsError && destinationsError.code !== 404)
    return <AlertError subject="Failed to load Warehouse destination" error={destinationsError} />
  if (!project || !organization || organization.id !== project.organization_id) {
    return (
      <AlertError
        subject="Failed to load organization"
        error={{
          message:
            'The source project organization could not be found. Refresh the page to try again.',
        }}
      />
    )
  }

  const destination = data?.destinations.find(({ name }) => name === WAREHOUSE_PUBLICATION_NAME)
  const destinationProjectRef = getWarehouseDestinationProjectRef(destination?.config)

  return (
    <WarehouseSetupFormContent
      key={`${project.ref}:${destination?.id ?? 'new'}`}
      {...props}
      sourceProject={{ ref: project.ref, name: project.name }}
      organizationSlug={organization.slug}
      organizationName={organization.name}
      destinationProjectRef={destinationProjectRef}
      hasDestination={destination !== undefined}
    />
  )
}

const WarehouseSetupFormContent = ({
  sourceProject,
  organizationSlug,
  organizationName,
  destinationProjectRef,
  hasDestination,
  onSubmit,
  isSubmitting,
  error,
}: WarehouseSetupFormProps & {
  sourceProject: { ref: string; name: string }
  organizationSlug: string
  organizationName: string
  destinationProjectRef?: string
  hasDestination: boolean
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      destinationProject: {
        ref: destinationProjectRef ?? sourceProject.ref,
        name:
          destinationProjectRef && destinationProjectRef !== sourceProject.ref
            ? destinationProjectRef
            : sourceProject.name,
      },
    },
  })
  const destinationProject = useWatch({ control: form.control, name: 'destinationProject' })
  const isCurrentProject = destinationProject.ref === sourceProject.ref
  const permissionOverrides = { organizationSlug, projectRef: destinationProject.ref }
  const { can: canWriteCatalog, isLoading: isCatalogPermissionPending } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    '*',
    undefined,
    permissionOverrides
  )
  const { can: canWriteStorage, isLoading: isStoragePermissionPending } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_WRITE,
    '*',
    undefined,
    permissionOverrides
  )
  const isPermissionPending =
    !isCurrentProject && (isCatalogPermissionPending || isStoragePermissionPending)
  const canUseDestination = isCurrentProject || (canWriteCatalog && canWriteStorage)
  const isSubmitDisabled = isSubmitting || isPermissionPending || !canUseDestination

  return (
    <Form {...form}>
      <PageSection className="pt-0!">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Storage and catalog</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent className="space-y-4">
          <Admonition
            type="default"
            title="Consider a separate project"
            description="A separate Supabase project can improve performance by keeping Storage and DuckLake catalog activity from competing with your application's database workload."
          />
          <Card>
            <CardContent>
              <FormField
                control={form.control}
                name="destinationProject"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Storage and catalog project"
                    description={`Uses the selected project's Postgres database for DuckLake catalog metadata and its Storage for data files. Projects are limited to ${organizationName}.`}
                  >
                    <OrganizationProjectSelector
                      slug={organizationSlug}
                      selectedRef={field.value.ref}
                      sameWidthAsTrigger
                      isOptionDisabled={(project) =>
                        project.status !== PROJECT_STATUS.ACTIVE_HEALTHY
                      }
                      onSelect={(project) => {
                        if (
                          hasDestination ||
                          isSubmitting ||
                          project.status !== PROJECT_STATUS.ACTIVE_HEALTHY
                        )
                          return
                        field.onChange({ ref: project.ref, name: project.name })
                      }}
                      renderTrigger={({ open, listboxId }) => (
                        <FormControl>
                          <Button
                            block
                            role="combobox"
                            aria-expanded={open}
                            aria-controls={listboxId}
                            disabled={hasDestination || isSubmitting}
                            onBlur={field.onBlur}
                            className="justify-between"
                            iconRight={<ChevronsUpDown size={16} />}
                          >
                            {hasDestination && !destinationProjectRef
                              ? 'Configured project'
                              : field.value.name}
                            {isCurrentProject &&
                              (!hasDestination || destinationProjectRef) &&
                              ' (current project)'}
                          </Button>
                        </FormControl>
                      )}
                      renderRow={(project) => (
                        <div className="flex flex-col">
                          <span>
                            {project.name}
                            {project.ref === sourceProject.ref && ' (current project)'}
                          </span>
                          <span className="text-xs text-foreground-lighter">
                            {project.ref} · {project.region}
                            {project.status !== PROJECT_STATUS.ACTIVE_HEALTHY && ' · Unavailable'}
                          </span>
                        </div>
                      )}
                    />
                  </FormItemLayout>
                )}
              />
              {hasDestination && (
                <p className="mt-3 text-sm text-foreground-light">
                  The storage and catalog project is fixed after setup, including when Warehouse is
                  disabled. Changing it requires migrating the existing Warehouse.
                </p>
              )}
              {!isPermissionPending && !canUseDestination && (
                <Admonition
                  type="warning"
                  className="mt-3 mb-0"
                  title="Additional permissions required"
                  description="You need SQL and Storage admin write permissions on the selected project. Choose another project or ask your organization owner for access."
                />
              )}
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>
      <WarehouseSchemaTablePicker
        isSubmitting={isSubmitting}
        isSubmitDisabled={isSubmitDisabled}
        error={error}
        onSubmit={(targets) => {
          if (isSubmitDisabled) return
          void form.handleSubmit(({ destinationProject }) => {
            onSubmit({
              targets,
              ...(!hasDestination ? { destination_project_ref: destinationProject.ref } : {}),
            })
          })()
        }}
      />
    </Form>
  )
}
