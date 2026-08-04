import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import {
  Badge,
  Checkbox,
  cn,
  FormControl,
  FormField,
  Label,
  RadioGroupStacked,
  RadioGroupStackedItem,
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
  const prefersReducedMotion = useReducedMotion()

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

  const exitTransition = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.97, filter: 'blur(4px)' }
  const enterTransition = prefersReducedMotion ? false : { opacity: 0, y: 16 }
  const formBackdropAnimate = isAccount
    ? {
        opacity: 0.5,
        scale: prefersReducedMotion ? 1 : 0.98,
        filter: prefersReducedMotion ? 'none' : 'blur(4px)',
      }
    : { opacity: 1, scale: 1, filter: 'none' }

  return (
    <section className="relative space-y-4 px-5 sm:px-6 py-6">
      <motion.div
        className={cn('space-y-4', isAccount && 'pointer-events-none')}
        animate={formBackdropAnimate}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        aria-hidden={isAccount}
        inert={isAccount}
      >
        <FormField
          control={control}
          name="resourceAccess"
          render={({ field }) => (
            <FormItemLayout
              layout="flex-row-reverse"
              label="Resource access"
              description={
                <p className="text-foreground-lighter text-sm">
                  Need access to every organization and project?{' '}
                  <button
                    type="button"
                    className="text-foreground-light underline hover:text-foreground transition-colors"
                    onClick={enableAccountLevel}
                    tabIndex={isAccount ? -1 : 0}
                  >
                    Advanced options
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
                    if (value !== 'account') setValue('accountConfirmed', false)
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
                    disabled={!organizationSlugs}
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
        )}
      </motion.div>

      <AnimatePresence>
        {isAccount && (
          <motion.div
            key="account"
            className="absolute inset-x-5 bottom-6 space-y-4 sm:inset-x-6"
            initial={enterTransition}
            animate={{ opacity: 1, y: 0 }}
            exit={exitTransition}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
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
                          <Label
                            htmlFor="accountConfirmed"
                            className="text-xs text-foreground-light"
                          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  )
}
