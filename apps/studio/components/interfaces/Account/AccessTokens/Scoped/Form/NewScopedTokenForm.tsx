import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Form, ScrollArea, Separator, SheetClose, SheetFooter } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { CLASSIC_TOKEN_WARNING } from '../../AccessToken.constants'
import { countConfigured, PermissionMode } from '../../AccessToken.permissions'
import { useTokenAccessEvaluation } from '../../hooks/useTokenAccessEvaluation'
import { DEFAULT_EXPIRY, TokenFormSchema, TokenFormValues } from './NewScopedTokenForm.utils'
import { NewScopedTokenFormReview } from './NewScopedTokenFormReview'
import { PermissionsAccordion } from './PermissionsAccordion'
import { ResourceAccessStep } from './ResourceAccessStep'
import { StepIndicator } from './StepIndicator'
import { TokenDetails } from './TokenDetails'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useGetEnabledEndpointsForCapability } from '@/data/scoped-access-tokens/permission-scope-map-query'

const FORM_ID = 'scoped-token-form'

const DEFAULT_VALUES: TokenFormValues = {
  tokenName: '',
  expiresAt: DEFAULT_EXPIRY,
  customExpiryDate: undefined,
  resourceAccess: 'project',
  organizationSlugs: [],
  projectRefs: [],
  permissions: {},
}

export const NewScopedTokenForm = ({
  isPending,
  onCreateToken,
  onCancel,
}: {
  isPending: boolean
  onCreateToken: (values: TokenFormValues) => void
  onCancel: () => void
}) => {
  const form = useForm<TokenFormValues>({
    resolver: zodResolver(TokenFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  })
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [formValues, setFormValues] = useState<TokenFormValues>(DEFAULT_VALUES)
  const [showMissingPermissionsWarning, setShowMissingPermissionsWarning] = useState(false)
  const resourceSectionRef = useRef<HTMLDivElement>(null)
  const resourceAccess = useWatch({ control: form.control, name: 'resourceAccess' })
  const selection = useWatch({ control: form.control, name: 'permissions' })
  const organizationSlugs = useWatch({
    control: form.control,
    name: 'organizationSlugs',
    defaultValue: [],
  })
  const projectRefs = useWatch({ control: form.control, name: 'projectRefs', defaultValue: [] })
  const configuredCount = useWatch({
    control: form.control,
    name: 'permissions',
    compute: (selection) => countConfigured(selection),
  })

  const access = useTokenAccessEvaluation({
    selection,
    resourceAccess,
    organizationSlugs,
    projectRefs,
    enabled: resourceAccess !== 'account',
  })

  const { data: permissionScopeMap, isError } = useGetEnabledEndpointsForCapability()

  useEffect(() => {
    if (isError) {
      toast.error('Something went wrong, try again')
      onCancel()
    }
  }, [onCancel, isError])

  // 'account' switches to the classic token flow: name + expiry only, no permissions or review.
  const isClassicMode = resourceAccess === 'account'

  // Single owner of the mode switch, so every entry point resets the same dependent fields.
  const handleSelectLegacyMode = () => {
    form.setValue('resourceAccess', 'account', { shouldValidate: true })
    form.setValue('organizationSlugs', [])
    form.setValue('projectRefs', [])
    // The fields unmount in legacy mode, so drop any validation errors they were holding.
    form.clearErrors(['organizationSlugs', 'projectRefs'])
  }

  const handleReviewAccess = async (values: TokenFormValues) => {
    if (values.resourceAccess === 'account') {
      onCreateToken(values)
      return
    }
    if (configuredCount === 0) {
      setShowMissingPermissionsWarning(true)
      return
    }
    setFormValues(values)
    setStep('review')
  }

  const handlePermissionChange = (key: string, mode: PermissionMode) => {
    form.setValue('permissions', { ...selection, [key]: mode })
    if (mode !== 'none') setShowMissingPermissionsWarning(false)
  }

  return (
    <>
      <ScrollArea className="flex-1">
        {step === 'form' ? (
          <Form {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(handleReviewAccess)}>
              {isClassicMode && (
                <div className="px-5 sm:px-6 pt-6">
                  <Admonition
                    type="warning"
                    className="mb-0"
                    title={CLASSIC_TOKEN_WARNING.title}
                    description={CLASSIC_TOKEN_WARNING.description}
                  />
                </div>
              )}
              <TokenDetails control={form.control} setValue={form.setValue} />
              {isClassicMode ? (
                <p className="px-5 sm:px-6 pb-6 text-foreground-lighter text-sm">
                  Only need a token for specific projects or organizations?{' '}
                  <button
                    type="button"
                    className={InlineLinkClassName}
                    onClick={() =>
                      form.setValue('resourceAccess', 'project', { shouldValidate: true })
                    }
                    tabIndex={0}
                  >
                    Create scoped token
                  </button>
                </p>
              ) : (
                <>
                  <Separator />
                  <div ref={resourceSectionRef}>
                    <ResourceAccessStep
                      control={form.control}
                      setValue={form.setValue}
                      onSelectLegacyToken={handleSelectLegacyMode}
                    />
                  </div>
                  <Separator />
                  <PermissionsAccordion
                    selection={selection}
                    onChange={handlePermissionChange}
                    permissionScopeMap={permissionScopeMap}
                    access={access}
                  />
                  {showMissingPermissionsWarning && (
                    <div className="space-y-3 px-5 sm:px-6 pb-6">
                      <Admonition
                        ref={(node) => {
                          node?.scrollIntoView()
                        }}
                        type="warning"
                        title="No permissions selected"
                        description="This token won't be able to do anything until you grant at least one permission."
                      />
                    </div>
                  )}
                </>
              )}
            </form>
          </Form>
        ) : (
          <NewScopedTokenFormReview
            values={formValues}
            access={access}
            permissionScopeMap={permissionScopeMap}
          />
        )}
      </ScrollArea>
      <SheetFooter className="mt-auto flex w-full items-center justify-between! border-t py-4 px-5 sm:px-6">
        {isClassicMode ? (
          <span />
        ) : (
          <StepIndicator step={step === 'form' ? 1 : 2} total={2} label="Configure" />
        )}
        <div className="flex items-center gap-3">
          {step === 'review' && (
            <>
              <span className="text-xs text-foreground-lighter">
                Access can't be changed after creation
              </span>
              <Button variant="default" disabled={isPending} onClick={() => setStep('form')}>
                Back
              </Button>
            </>
          )}
          <SheetClose asChild disabled={isPending}>
            <Button variant="default">Cancel</Button>
          </SheetClose>
          {step === 'form' && isClassicMode && (
            <Button type="submit" form={FORM_ID} loading={isPending}>
              Generate token
            </Button>
          )}
          {step === 'form' && !isClassicMode && (
            <Button type="submit" form={FORM_ID} iconRight={<ChevronRight />}>
              Review access
            </Button>
          )}
          {step === 'review' && (
            <Button loading={isPending} onClick={() => onCreateToken(formValues)}>
              Create token
            </Button>
          )}
        </div>
      </SheetFooter>
    </>
  )
}
