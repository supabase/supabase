import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
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
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
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

interface ResourceAccessStepProps {
  form: UseFormReturn<TokenFormValues>
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

export const ResourceAccessStep = ({ form, error }: ResourceAccessStepProps) => {
  const { organizations, projects } = useOrgAndProjectData()

  const resourceAccess = form.watch('resourceAccess')
  const organizationSlugs = form.watch('organizationSlugs', [])
  const accountConfirmed = form.watch('accountConfirmed')

  const isAccount = resourceAccess === 'account'

  const projectsForOrg = useMemo(
    () => projects.filter((project) => organizationSlugs.includes(project.organization_slug)),
    [projects, organizationSlugs]
  )

  const enableAccountLevel = () => {
    form.setValue('resourceAccess', 'account', { shouldValidate: true })
    form.setValue('organizationSlugs', [])
    form.setValue('projectRefs', [])
  }

  const switchBackToSingleProject = () => {
    form.setValue('resourceAccess', 'project', { shouldValidate: true })
    form.setValue('accountConfirmed', false)
  }

  return (
    <section className="space-y-4 px-5 sm:px-6 py-6">
      <div>
        <h3 className="text-sm text-foreground">Resource access</h3>
        <p className="text-xs text-foreground-light">Choose what this token can reach.</p>
      </div>

      <FormField
        control={form.control}
        name="resourceAccess"
        render={({ field }) => (
          <RadioGroupCard
            className="grid-cols-2"
            value={isAccount ? undefined : resourceAccess}
            onValueChange={(value) => {
              field.onChange(value)
              // Reset dependent selections when switching modes.
              form.setValue('projectRefs', [])
              if (value !== 'account') form.setValue('accountConfirmed', false)
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

      {!isAccount && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            {resourceAccess === 'project' ? (
              <FormField
                control={form.control}
                name="organizationSlugs"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Organization" id="organizationSlugs">
                    <FormControl>
                      <Select
                        value={field.value.length > 0 ? field.value[0] : ''}
                        onValueChange={(value) => {
                          field.onChange([value])
                          form.setValue('projectRefs', [])
                        }}
                      >
                        <SelectTrigger id="organizationSlugs" ref={field.ref}>
                          <SelectValue placeholder="Select an organization" />
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
            ) : (
              <FormField
                control={form.control}
                name="organizationSlugs"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Organizations" id="organizationSlugs">
                    <MultiSelector onValuesChange={field.onChange} values={field.value}>
                      <MultiSelectorTrigger
                        mode="combobox"
                        label="Select organizations"
                        badgeLimit="wrap"
                        showIcon={false}
                        deletableBadge
                        className="w-full h-[34px] min-h-auto"
                        ref={field.ref}
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
            )}
          </div>

          {resourceAccess === 'project' && (
            <FormField
              control={form.control}
              name="projectRefs"
              render={({ field }) => (
                <FormItemLayout layout="vertical" label="Projects" id="projectRefs">
                  <MultiSelector
                    onValuesChange={field.onChange}
                    values={field.value}
                    disabled={!organizationSlugs}
                  >
                    <MultiSelectorTrigger
                      mode="combobox"
                      label={organizationSlugs ? 'Select projects' : 'Select an organization first'}
                      badgeLimit="wrap"
                      showIcon={false}
                      deletableBadge
                      className="w-full h-[34px] min-h-auto"
                      ref={field.ref}
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
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {!isAccount ? (
        <p className="text-xs text-foreground-lighter">
          Need access to every organization and project?{' '}
          <button
            type="button"
            className="text-foreground-light underline hover:text-foreground transition-colors"
            onClick={enableAccountLevel}
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
                <Checkbox
                  id="accountConfirmed"
                  checked={accountConfirmed ?? false}
                  onCheckedChange={(checked) =>
                    form.setValue('accountConfirmed', checked === true, { shouldValidate: true })
                  }
                />
                <Label htmlFor="accountConfirmed" className="text-xs text-foreground-light">
                  I understand this token is not limited to one project or organization.
                </Label>
              </div>
              <button
                type="button"
                className="text-xs text-foreground-light underline hover:text-foreground transition-colors"
                onClick={switchBackToSingleProject}
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
