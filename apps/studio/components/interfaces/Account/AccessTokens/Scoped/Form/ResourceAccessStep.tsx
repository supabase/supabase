import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Badge,
  Checkbox,
  cn,
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

import type { ResourceAccessMode } from '../../AccessToken.permissions'
import { useOrgAndProjectData } from '../../hooks/useOrgAndProjectData'
import type { TokenFormValues } from './tokenForm'

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
    value: 'single-project',
    name: 'Single project',
    description: 'Access one project only.',
    recommended: true,
  },
  {
    value: 'organization',
    name: 'Organization',
    description: 'Access projects in one organization.',
  },
]

export const ResourceAccessStep = ({ form, error }: ResourceAccessStepProps) => {
  const { organizations, projects } = useOrgAndProjectData()

  const resourceAccess = form.watch('resourceAccess')
  const organizationSlug = form.watch('organizationSlug')
  const projectRef = form.watch('projectRef')
  const accountConfirmed = form.watch('accountConfirmed')

  const isAccount = resourceAccess === 'account'

  const projectsForOrg = useMemo(
    () => projects.filter((project) => project.organization_slug === organizationSlug),
    [projects, organizationSlug]
  )

  const handleModeChange = (value: string) => {
    form.setValue('resourceAccess', value as ResourceAccessMode, { shouldValidate: true })
    // Reset dependent selections when switching modes.
    form.setValue('projectRef', undefined)
    if (value !== 'account') form.setValue('accountConfirmed', false)
  }

  const handleOrgChange = (slug: string) => {
    form.setValue('organizationSlug', slug, { shouldValidate: true })
    form.setValue('projectRef', undefined)
  }

  const enableAccountLevel = () => {
    form.setValue('resourceAccess', 'account', { shouldValidate: true })
    form.setValue('organizationSlug', undefined)
    form.setValue('projectRef', undefined)
  }

  const switchBackToSingleProject = () => {
    form.setValue('resourceAccess', 'single-project', { shouldValidate: true })
    form.setValue('accountConfirmed', false)
  }

  return (
    <section className="space-y-4 px-5 sm:px-6 py-6">
      <div>
        <h3 className="text-sm text-foreground">Resource access</h3>
        <p className="text-xs text-foreground-light">Choose what this token can reach.</p>
      </div>

      <RadioGroupCard
        className="grid-cols-2"
        value={isAccount ? undefined : resourceAccess}
        onValueChange={handleModeChange}
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

      {!isAccount && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="resource-access-org" className="text-xs text-foreground-light">
              Organization
            </Label>
            <Select value={organizationSlug ?? ''} onValueChange={handleOrgChange}>
              <SelectTrigger id="resource-access-org">
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
          </div>

          {resourceAccess === 'single-project' && (
            <div className="space-y-1">
              <Label htmlFor="resource-access-project" className="text-xs text-foreground-light">
                Project
              </Label>
              <Select
                value={projectRef ?? ''}
                onValueChange={(ref) => form.setValue('projectRef', ref, { shouldValidate: true })}
                disabled={!organizationSlug}
              >
                <SelectTrigger id="resource-access-project">
                  <SelectValue
                    placeholder={
                      organizationSlug ? 'Select a project' : 'Select an organization first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projectsForOrg.map((project) => (
                    <SelectItem key={project.ref} value={project.ref}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
