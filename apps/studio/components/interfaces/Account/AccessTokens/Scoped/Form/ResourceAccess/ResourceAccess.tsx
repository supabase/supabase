import { Box, Check } from 'lucide-react'

import { useProfile } from 'lib/profile'
import { FormControl_Shadcn_, FormField_Shadcn_, cn } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useOrgAndProjectData } from '../../../hooks/useOrgAndProjectData'
import { ResourceAccessProps } from './ResourceAccess.types'
import { ResourceMultiSelector } from './ResourceMultiSelector'

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
