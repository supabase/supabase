import { Control } from 'react-hook-form'
import {
  FormField_Shadcn_,
  FormControl_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { Check, Box } from 'lucide-react'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'

interface TokenResourceAccessFormProps {
  control: Control<any>
  resourceAccess: string
}

export const TokenResourceAccessForm = ({
  control,
  resourceAccess,
}: TokenResourceAccessFormProps) => {
  const { data: organizations = [], isLoading: isLoadingOrgs } = useOrganizationsQuery()
  const { data: projects = [], isLoading: isLoadingProjects } = useProjectsQuery()

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
                  <label
                    className={cn(
                      'border border-default rounded-md bg-surface-200 hover:bg-overlay-hover hover:border-control px-4 py-3 cursor-pointer transition-colors flex-1 flex flex-col',
                      field.value === 'all-orgs' &&
                        'border-foreground-muted hover:border-foreground-muted bg-surface-300'
                    )}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        field.onChange('all-orgs')
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Box size={16} className="text-foreground-light" />
                      {field.value === 'all-orgs' && (
                        <div className="flex items-center justify-center p-0.5 bg-foreground text-background rounded-full">
                          <Check size={12} strokeWidth="4" className="text-background" />
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm',
                        field.value === 'all-orgs' ? 'text-foreground' : 'text-foreground-light'
                      )}
                    >
                      Everything
                    </span>
                    <input
                      type="radio"
                      name="resourceAccess"
                      value="all-orgs"
                      checked={field.value === 'all-orgs'}
                      onChange={() => field.onChange('all-orgs')}
                      className="invisible h-0 w-0 border-0"
                    />
                  </label>

                  <label
                    className={cn(
                      'border border-default rounded-md bg-surface-200 hover:bg-overlay-hover hover:border-control px-4 py-3 cursor-pointer transition-colors flex-1 flex flex-col',
                      field.value === 'selected-orgs' &&
                        'border-foreground-muted hover:border-foreground-muted bg-surface-300'
                    )}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        field.onChange('selected-orgs')
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Box size={16} className="text-foreground-light" />
                      {field.value === 'selected-orgs' && (
                        <div className="flex items-center justify-center p-0.5 bg-foreground text-background rounded-full">
                          <Check size={12} strokeWidth="4" className="text-background" />
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm',
                        field.value === 'selected-orgs'
                          ? 'text-foreground'
                          : 'text-foreground-light'
                      )}
                    >
                      Selected orgs
                    </span>
                    <input
                      type="radio"
                      name="resourceAccess"
                      value="selected-orgs"
                      checked={field.value === 'selected-orgs'}
                      onChange={() => field.onChange('selected-orgs')}
                      className="invisible h-0 w-0 border-0"
                    />
                  </label>

                  <label
                    className={cn(
                      'border border-default rounded-md bg-surface-200 hover:bg-overlay-hover hover:border-control px-4 py-3 cursor-pointer transition-colors flex-1 flex flex-col',
                      field.value === 'selected-projects' &&
                        'border-foreground-muted hover:border-foreground-muted bg-surface-300'
                    )}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        field.onChange('selected-projects')
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Box size={16} className="text-foreground-light" />
                      {field.value === 'selected-projects' && (
                        <div className="flex items-center justify-center p-0.5 bg-foreground text-background rounded-full">
                          <Check size={12} strokeWidth="4" className="text-background" />
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm',
                        field.value === 'selected-projects'
                          ? 'text-foreground'
                          : 'text-foreground-light'
                      )}
                    >
                      Selected projects
                    </span>
                    <input
                      type="radio"
                      name="resourceAccess"
                      value="selected-projects"
                      checked={field.value === 'selected-projects'}
                      onChange={() => field.onChange('selected-projects')}
                      className="invisible h-0 w-0 border-0"
                    />
                  </label>
                </fieldset>

                {field.value === 'all-orgs' && (
                  <p className="text-foreground-light text-sm">
                    Access to all projects across all organizations you have access to.
                  </p>
                )}

                {field.value === 'selected-orgs' && (
                  <p className="text-foreground-light text-sm">
                    Access only to the organizations you have specified.
                  </p>
                )}

                {field.value === 'selected-projects' && (
                  <p className="text-foreground-light text-sm">
                    Access only to the projects you have specified.
                  </p>
                )}
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
                    <MultiSelectorList>
                      {isLoadingOrgs ? (
                        <div className="px-3 py-2 text-sm text-foreground-light">Loading organizations...</div>
                      ) : organizations.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-foreground-light">No organizations available</div>
                      ) : (
                        organizations.map((org) => (
                          <MultiSelectorItem key={org.slug} value={org.name}>
                            {org.name}
                          </MultiSelectorItem>
                        ))
                      )}
                    </MultiSelectorList>
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
                    <MultiSelectorList>
                      {isLoadingProjects ? (
                        <div className="px-3 py-2 text-sm text-foreground-light">Loading projects...</div>
                      ) : projects.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-foreground-light">No projects available</div>
                      ) : (
                        projects.map((project) => (
                          <MultiSelectorItem key={project.ref} value={project.name}>
                            {project.name}
                          </MultiSelectorItem>
                        ))
                      )}
                    </MultiSelectorList>
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
