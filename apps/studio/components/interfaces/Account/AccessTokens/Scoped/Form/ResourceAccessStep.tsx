import { useMemo } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import {
  Badge,
  Checkbox,
  cn,
  FormControl,
  FormField,
  Label,
  RadioGroupCard,
  RadioGroupCardItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useWatch,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
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
import { useOrgAndProjectData } from '../../hooks/useOrgAndProjectData'
import type { TokenFormValues } from './NewScopedTokenForm.utils'
import { ProjectInfoInfinite } from '@/data/projects/projects-infinite-query'
import { Organization } from '@/types'

interface ResourceAccessStepProps {
  control: Control<TokenFormValues>
  setValue: UseFormSetValue<TokenFormValues>

  /** Inline error surfaced only after an attempt to advance. */
  error?: string
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
    description: 'Access selected projects only.',
    recommended: true,
  },
  {
    value: 'organization',
    name: 'Organization',
    description: 'Access all projects in selected organizations.',
  },
]

export const ResourceAccessStep = ({ control, setValue, error }: ResourceAccessStepProps) => {
  const { organizations, projects } = useOrgAndProjectData()
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
  const accountConfirmed = useWatch({ control, name: 'accountConfirmed' })

  const isAccount = resourceAccess === 'account'

  const projectsForOrg = useMemo(
    () => projects.filter((project) => organizationSlugs.includes(project.organization_slug)),
    [projects, organizationSlugs]
  )

  const enableAccountLevel = () => {
    setValue('resourceAccess', 'account', { shouldValidate: true })
    setValue('organizationSlugs', [])
    setValue('projectRefs', [])
  }

  const switchBackToSingleProject = () => {
    setValue('resourceAccess', 'project', { shouldValidate: true })
    setValue('accountConfirmed', false)
  }

  return (
    <section className="space-y-4 px-5 sm:px-6 py-6">
      <div>
        <h3 className="text-sm text-foreground">Resource access</h3>
        <p className="text-xs text-foreground-light">Choose what this token can reach.</p>
      </div>

      <FormField
        control={control}
        name="resourceAccess"
        render={({ field }) => (
          <RadioGroupCard
            className={cn('grid-cols-2', {
              'pointer-events-none': isAccount,
            })}
            value={isAccount ? undefined : resourceAccess}
            onValueChange={(value) => {
              field.onChange(value)
              // Reset dependent selections when switching modes.
              setValue('projectRefs', [])
              if (value !== 'account') setValue('accountConfirmed', false)
            }}
            disabled={isAccount}
          >
            {CARD_OPTIONS.map((option) => (
              <RadioGroupCardItem
                key={option.value}
                id={option.value}
                value={option.value}
                className={cn('w-full', isAccount && 'opacity-50')}
                disabled={isAccount}
                label={
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{option.name}</span>
                      {option.recommended && <Badge variant="success">Recommended</Badge>}
                    </div>
                    <span className="text-foreground-light">{option.description}</span>
                  </div>
                }
              />
            ))}
          </RadioGroupCard>
        )}
      />

      {!isAccount && resourceAccess === 'project' ? (
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={control}
            name="organizationSlugs"
            render={({ field }) => (
              <FormItemLayout layout="vertical" label="Organization" id="organizationSlugs">
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
              <FormItemLayout layout="vertical" label="Projects" id="projectRefs">
                <MultiSelector
                  onValuesChange={field.onChange}
                  values={field.value}
                  disabled={!organizationSlugs}
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
                    showIcon={false}
                    deletableBadge
                    className="w-full"
                    ref={field.ref}
                    renderValue={(value) => projectsByRef[value]?.name}
                  />
                  <MultiSelectorContent>
                    <MultiSelectorInput placeholder="Search organizations" showResetIcon />
                    <MultiSelectorList>
                      {projectsForOrg.map((project) => (
                        <MultiSelectorItem key={project.ref} value={project.ref}>
                          {project.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormItemLayout>
            )}
          />
        </div>
      ) : null}
      {!isAccount && resourceAccess === 'organization' ? (
        <FormField
          control={control}
          name="organizationSlugs"
          render={({ field }) => (
            <FormItemLayout layout="vertical" label="Organizations" id="organizationSlugs">
              <MultiSelector onValuesChange={field.onChange} values={field.value}>
                <MultiSelectorTrigger
                  id="organizationSlugs"
                  mode="combobox"
                  label="Select organizations"
                  badgeLimit="wrap"
                  showIcon={false}
                  deletableBadge
                  className="w-full"
                  ref={field.ref}
                  renderValue={(value) => organizationsBySlug[value]?.name}
                />
                <MultiSelectorContent>
                  <MultiSelectorInput placeholder="Search organizations" showResetIcon />
                  <MultiSelectorList>
                    {organizations.map((organization) => (
                      <MultiSelectorItem key={organization.slug} value={organization.slug}>
                        {organization.name}
                      </MultiSelectorItem>
                    ))}
                  </MultiSelectorList>
                </MultiSelectorContent>
              </MultiSelector>
            </FormItemLayout>
          )}
        />
      ) : null}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {!isAccount ? (
        <p className="text-xs text-foreground-lighter">
          Need access to every organization and project?{' '}
          <button
            type="button"
            className="text-foreground-light underline hover:text-foreground transition-colors"
            onClick={enableAccountLevel}
            tabIndex={0}
          >
            Advanced options
          </button>
        </p>
      ) : (
        <Admonition
          type="warning"
          title="Account-level access is broad."
          description={
            <div className="space-y-3">
              <p>
                This token can reach every organization and project you have access to. Prefer a
                single project or organization unless you specifically need account-wide access.
              </p>
              <div className="flex items-start gap-2">
                <FormField
                  control={control}
                  name="accountConfirmed"
                  render={({ field }) => (
                    <>
                      <Checkbox
                        id="accountConfirmed"
                        checked={accountConfirmed ?? false}
                        onCheckedChange={(checked) => field.onChange(checked)}
                      />
                      <Label htmlFor="accountConfirmed" className="text-xs text-foreground-light">
                        I understand this token is not limited to one project or organization.
                      </Label>
                    </>
                  )}
                />
              </div>
              <button
                type="button"
                className="text-xs text-foreground-light underline hover:text-foreground transition-colors"
                onClick={switchBackToSingleProject}
                tabIndex={0}
              >
                Switch back
              </button>
            </div>
          }
        />
      )}
    </section>
  )
}
