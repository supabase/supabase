import { useOrgAndProjectData } from 'components/interfaces/Account/AccessTokens/hooks/useOrgAndProjectData'
import { useProfile } from 'lib/profile'
import { FormControl_Shadcn_, FormField_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ResourceAccessProps } from './ResourceAccess.types'
import { ResourceMultiSelector } from './ResourceMultiSelector'
import { ResourceOption } from './ResourceOption'

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

export const ResourceAccess = ({ control, resourceAccess, setValue }: ResourceAccessProps) => {
  const { profile } = useProfile()

  const { organizations, projects, isLoadingOrgs, isLoadingProjects } = useOrgAndProjectData({
    enabled: !!profile,
  })

  const handleResourceAccessChange = (newValue: string, currentValue: string) => {
    if (newValue !== currentValue) {
      setValue('selectedOrganizations', [])
      setValue('selectedProjects', [])
    }
  }

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
                  <legend className="sr-only">Resource access level</legend>
                  {RESOURCE_OPTIONS.map((option) => (
                    <ResourceOption
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      isSelected={field.value === option.value}
                      onChange={() => {
                        handleResourceAccessChange(option.value, field.value)
                        field.onChange(option.value)
                      }}
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
            <ResourceMultiSelector
              field={field}
              items={organizations.map((org) => ({ id: org.slug, name: org.name }))}
              isLoading={isLoadingOrgs}
              fieldName="selectedOrganizations"
              label="Select organizations"
              loadingMessage="Loading organizations..."
              emptyMessage="No organizations available"
            />
          )}
        />
      )}

      {resourceAccess === 'selected-projects' && (
        <FormField_Shadcn_
          key="selectedProjects"
          name="selectedProjects"
          control={control}
          render={({ field }) => (
            <ResourceMultiSelector
              field={field}
              items={projects.map((project) => ({ id: project.ref, name: project.name }))}
              isLoading={isLoadingProjects}
              fieldName="selectedProjects"
              label="Select projects"
              loadingMessage="Loading projects..."
              emptyMessage="No projects available"
            />
          )}
        />
      )}
    </div>
  )
}
