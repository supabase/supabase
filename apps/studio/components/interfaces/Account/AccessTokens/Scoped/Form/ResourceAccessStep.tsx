import { useMemo } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import {
  Badge,
  FormControl,
  FormField,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useWatch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

import type { ResourceAccessMode } from '../../AccessToken.permissions'
import { getIsProjectScopedOnly } from '../../AccessToken.roles'
import type { TokenFormValues } from './NewScopedTokenForm.utils'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { usePermissionsQuery } from '@/data/permissions/permissions-query'
import {
  ProjectInfoInfinite,
  ProjectsInfiniteData,
  useProjectsInfiniteQuery,
} from '@/data/projects/projects-infinite-query'
import { Organization } from '@/types'

interface ResourceAccessStepProps {
  control: Control<TokenFormValues>
  setValue: UseFormSetValue<TokenFormValues>

  /** Switches the form into legacy (account-wide) token mode. */
  onSelectLegacyToken: () => void
}

const CARD_OPTIONS: {
  value: Exclude<ResourceAccessMode, 'account'>
  name: string
  description: string
  recommended?: boolean
}[] = [
  {
    value: 'project',
    name: 'Project',
    description: 'Access select projects in a single organization.',
    recommended: true,
  },
  {
    value: 'organization',
    name: 'Organization',
    description: 'Access all projects in select organizations.',
  },
]

export const ResourceAccessStep = ({
  control,
  setValue,
  onSelectLegacyToken,
}: ResourceAccessStepProps) => {
  const { data: organizations = [] } = useOrganizationsQuery()
  const {
    data: projectsData,
    hasNextPage,
    fetchNextPage,
  } = useProjectsInfiniteQuery({
    limit: 100,
  })

  const projects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects) ?? [],
    [projectsData]
  )
  const organizationsBySlug = useMemo(
    () =>
      organizations.reduce(
        (acc, organization) => {
          acc[organization.slug] = organization
          return acc
        },
        {} as Record<string, Organization>
      ),
    [organizations]
  )
  const projectsByRef = useMemo(
    () =>
      projects.reduce(
        (acc, project) => {
          acc[project.ref] = project
          return acc
        },
        {} as Record<string, ProjectInfoInfinite>
      ),
    [projects]
  )

  const resourceAccess = useWatch({ control, name: 'resourceAccess' })
  const organizationSlugs = useWatch({ control, name: 'organizationSlugs', defaultValue: [] })

  // Users invited to specific projects (rather than the whole org) can't select that org for an
  // org-wide token. Skipped while permissions are still loading so nothing gets disabled by
  // mistake. The project list itself needs no permission filter — /platform/projects is already
  // scoped server-side to what the user can access.
  const { data: permissions } = usePermissionsQuery()
  const projectScopedOrgSlugs = useMemo(() => {
    if (permissions === undefined) return new Set<string>()
    return new Set(
      organizations
        .map((org) => org.slug)
        .filter((slug) => getIsProjectScopedOnly(permissions, slug))
    )
  }, [permissions, organizations])

  const projectsForOrg = useMemo(
    () => projects.filter((project) => organizationSlugs.includes(project.organization_slug)),
    [projects, organizationSlugs]
  )

  return (
    <section className="space-y-4 px-5 sm:px-6 py-6">
      <FormField
        control={control}
        name="resourceAccess"
        render={({ field }) => (
          <FormItemLayout
            layout="flex-row-reverse"
            label="Resource access"
            description={
              <p className="text-foreground-lighter text-sm">
                Need a token with full access to your account?{' '}
                <button
                  type="button"
                  tabIndex={0}
                  className={InlineLinkClassName}
                  onClick={onSelectLegacyToken}
                >
                  Create legacy token
                </button>
              </p>
            }
            id="resourceAccess"
          >
            <FormControl>
              <RadioGroupStacked
                value={resourceAccess}
                onValueChange={(value) => {
                  field.onChange(value)
                  // Reset dependent selections when switching modes.
                  setValue('projectRefs', [])
                }}
              >
                {CARD_OPTIONS.map((option) => (
                  <RadioGroupStackedItem
                    key={option.value}
                    id={option.value}
                    value={option.value}
                    className="w-full"
                    label={
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-foreground">{option.name}</span>
                          {option.recommended && <Badge variant="success">Recommended</Badge>}
                        </div>
                        <span className="text-foreground-light">{option.description}</span>
                      </div>
                    }
                  />
                ))}
              </RadioGroupStacked>
            </FormControl>
          </FormItemLayout>
        )}
      />

      {resourceAccess === 'project' && (
        <>
          <FormField
            control={control}
            name="organizationSlugs"
            render={({ field }) => (
              <FormItemLayout
                layout="flex-row-reverse"
                label={<span className="sr-only">Organization</span>}
                id="organizationSlugs"
              >
                <FormControl>
                  <Select
                    value={field.value.length > 0 ? field.value[0] : ''}
                    onValueChange={(value) => {
                      field.onChange([value])
                      setValue('projectRefs', [])
                    }}
                  >
                    <SelectTrigger id="organizationSlugs" ref={field.ref}>
                      <SelectValue placeholder="Select an organization" asChild>
                        <span>{organizationsBySlug[field.value[0]]?.name}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.slug} value={org.slug}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItemLayout>
            )}
          />
          <FormField
            control={control}
            name="projectRefs"
            render={({ field }) => (
              <FormItemLayout
                layout="flex-row-reverse"
                label={<span className="sr-only">Projects</span>}
                id="projectRefs"
              >
                <MultiSelector
                  onValuesChange={field.onChange}
                  values={field.value}
                  disabled={organizationSlugs.length === 0}
                  className="w-full"
                >
                  <MultiSelectorTrigger
                    id="projectRefs"
                    mode="combobox"
                    label={
                      organizationSlugs.length > 0
                        ? 'Select projects'
                        : 'Select an organization first'
                    }
                    badgeLimit="wrap"
                    showIcon={true}
                    deletableBadge
                    ref={field.ref}
                    renderValue={(value) => projectsByRef[value]?.name}
                    className="min-w-auto"
                  />
                  <MultiSelectorContent>
                    <MultiSelectorInput placeholder="Search projects" showResetIcon />
                    <ProjectMultiSelectList
                      projects={projectsForOrg}
                      hasNextPage={hasNextPage}
                      fetchNextPage={fetchNextPage}
                    />
                  </MultiSelectorContent>
                </MultiSelector>
              </FormItemLayout>
            )}
          />
        </>
      )}
      {resourceAccess === 'organization' && (
        <FormField
          control={control}
          name="organizationSlugs"
          render={({ field }) => (
            <FormItemLayout
              layout="flex-row-reverse"
              label={<span className="sr-only">Organizations</span>}
              id="organizationSlugs"
            >
              <MultiSelector onValuesChange={field.onChange} values={field.value}>
                <MultiSelectorTrigger
                  id="organizationSlugs"
                  mode="combobox"
                  label="Select organizations"
                  badgeLimit="wrap"
                  showIcon={true}
                  deletableBadge
                  className="w-full"
                  ref={field.ref}
                  renderValue={(value) => organizationsBySlug[value]?.name}
                />
                <MultiSelectorContent>
                  <MultiSelectorInput placeholder="Search organizations" showResetIcon />
                  <MultiSelectorList>
                    {organizations.map((organization) => {
                      const isProjectScopedOnly = projectScopedOrgSlugs.has(organization.slug)
                      return (
                        <MultiSelectorItem
                          key={organization.slug}
                          value={organization.slug}
                          disabled={isProjectScopedOnly}
                        >
                          <span className="flex flex-col gap-0.5">
                            <span>{organization.name}</span>
                            {isProjectScopedOnly && (
                              <span className="text-foreground-lighter">
                                Your access is limited to specific projects. Create a project-scoped
                                token instead.
                              </span>
                            )}
                          </span>
                        </MultiSelectorItem>
                      )
                    })}
                  </MultiSelectorList>
                </MultiSelectorContent>
              </MultiSelector>
            </FormItemLayout>
          )}
        />
      )}
    </section>
  )
}

const ProjectMultiSelectList = ({
  projects,
  hasNextPage,
  fetchNextPage,
}: {
  projects: ProjectsInfiniteData['projects']
  hasNextPage: boolean
  fetchNextPage: () => void
}) => {
  const handleScroll = (event: React.UIEvent) => {
    const element = event.currentTarget as HTMLElement
    const offset = 50 // Offset by approximately 1 item to start fetching next page before hitting the bottom
    const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - offset
    if (hasNextPage && isAtBottom) {
      fetchNextPage()
    }
  }

  return (
    <MultiSelectorList onScroll={handleScroll}>
      {projects.map((project) => (
        <MultiSelectorItem key={project.ref} value={project.ref}>
          {project.name}
        </MultiSelectorItem>
      ))}
    </MultiSelectorList>
  )
}
