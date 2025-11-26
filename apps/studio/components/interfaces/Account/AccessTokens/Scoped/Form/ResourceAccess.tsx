import { Box, Check } from 'lucide-react'
import { Control } from 'react-hook-form'
import { useMemo } from 'react'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsInfiniteQuery } from 'data/projects/projects-infinite-query'
import { useProfile } from 'lib/profile'
import { FormControl_Shadcn_, FormField_Shadcn_, cn } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

interface ResourceAccessProps {
  control: Control<{
    resourceAccess: 'selected-orgs' | 'selected-projects' | 'all-orgs'
    tokenName: string
    selectedOrganizations?: string[]
    selectedProjects?: string[]
    expiresAt?: string
    organizationPermissions?: Record<string, string>
    projectPermissions?: Record<string, string>
    permissionRows?: { resource: string; action: string }[]
  }>
  resourceAccess: string
}

const RESOURCE_OPTIONS = [
  {
    value: 'all-orgs' as const,
    label: 'Everything',
    description: 'Access to all projects across all organizations you have access to.',
  },
  {
    value: 'selected-orgs' as const,
    label: 'Selected orgs',
    description: 'Access only to the organizations you have specified.',
  },
  {
    value: 'selected-projects' as const,
    label: 'Selected projects',
    description: 'Access only to the projects you have specified.',
  },
]

export const ResourceAccess = ({ control, resourceAccess }: ResourceAccessProps) => {
  const { profile } = useProfile()

  const { data: organizations = [], isLoading: isLoadingOrgs } = useOrganizationsQuery({
    enabled: !!profile,
  })

  const { data: projectsData, isLoading: isLoadingProjects } = useProjectsInfiniteQuery({
    limit: 100,
  })

  const projects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects) ?? [],
    [projectsData]
  )

  return (
    <div className="space-y-4 px-5 sm:px-6 py-6">
      <FormField_Shadcn_
        key="resourceAccess"
        name="resourceAccess"
        control={control}
        render={({ field }) => (
          <FormItemLayout name="resourceAccess" label="Resource access">
            <FormControl_Shadcn_>
              <div className="space-y-3">
                <fieldset className="flex gap-3">
                  {RESOURCE_OPTIONS.map((option) => (
                    <ResourceOption
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      isSelected={field.value === option.value}
                      onChange={() => field.onChange(option.value)}
                    />
                  ))}
                </fieldset>

                <p className="text-foreground-light text-sm">
                  {RESOURCE_OPTIONS.find((opt) => opt.value === field.value)?.description}
                </p>
              </div>
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />

      {resourceAccess === 'selected-orgs' && (
        <FormField_Shadcn_
          key="selectedOrganizations"
          name="selectedOrganizations"
          control={control}
          render={({ field }) => (
            <FormItemLayout name="selectedOrganizations" label="Select organizations">
              <FormControl_Shadcn_ className="overflow-visible">
                <MultiSelector values={field.value || []} onValuesChange={field.onChange}>
                  <MultiSelectorTrigger
                    deletableBadge
                    showIcon={false}
                    mode="inline-combobox"
                    label="Select organizations"
                    badgeLimit="wrap"
                  />
                  <MultiSelectorContent className="z-50">
                    {isLoadingOrgs ? (
                      <div className="px-3 py-2 text-sm text-foreground-light">
                        Loading organizations...
                      </div>
                    ) : organizations.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-foreground-light">
                        No organizations available
                      </div>
                    ) : (
                      <MultiSelectorList>
                        {organizations.map((org) => (
                          <MultiSelectorItem key={org.slug} value={org.slug}>
                            {org.name}
                          </MultiSelectorItem>
                        ))}
                      </MultiSelectorList>
                    )}
                  </MultiSelectorContent>
                </MultiSelector>
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />
      )}

      {resourceAccess === 'selected-projects' && (
        <FormField_Shadcn_
          key="selectedProjects"
          name="selectedProjects"
          control={control}
          render={({ field }) => (
            <FormItemLayout name="selectedProjects" label="Select projects">
              <FormControl_Shadcn_ className="overflow-visible">
                <MultiSelector values={field.value || []} onValuesChange={field.onChange}>
                  <MultiSelectorTrigger
                    deletableBadge
                    showIcon={false}
                    mode="inline-combobox"
                    label="Select projects"
                    badgeLimit="wrap"
                  />
                  <MultiSelectorContent className="z-50">
                    {isLoadingProjects ? (
                      <div className="px-3 py-2 text-sm text-foreground-light">
                        Loading projects...
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-foreground-light">
                        No projects available
                      </div>
                    ) : (
                      <MultiSelectorList>
                        {projects.map((project) => (
                          <MultiSelectorItem key={project.ref} value={project.ref}>
                            {project.name}
                          </MultiSelectorItem>
                        ))}
                      </MultiSelectorList>
                    )}
                  </MultiSelectorContent>
                </MultiSelector>
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />
      )}
    </div>
  )
}

// Extracted component for radio options
const ResourceOption = ({
  value,
  label,
  isSelected,
  onChange,
}: {
  value: string
  label: string
  isSelected: boolean
  onChange: () => void
}) => (
  <label
    className={cn(
      'border border-default rounded-md bg-surface-200 hover:bg-overlay-hover hover:border-control px-4 py-3 cursor-pointer transition-colors flex-1 flex flex-col',
      isSelected && 'border-foreground-muted hover:border-foreground-muted bg-surface-300'
    )}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onChange()
      }
    }}
  >
    <div className="flex justify-between items-start mb-3">
      <Box size={16} className="text-foreground-light" />
      {isSelected && (
        <div className="flex items-center justify-center p-0.5 bg-foreground text-background rounded-full">
          <Check size={12} strokeWidth="4" className="text-background" />
        </div>
      )}
    </div>
    <span className={cn('text-sm', isSelected ? 'text-foreground' : 'text-foreground-light')}>
      {label}
    </span>
    <input
      type="radio"
      name="resourceAccess"
      value={value}
      checked={isSelected}
      onChange={onChange}
      className="invisible h-0 w-0 border-0"
    />
  </label>
)
