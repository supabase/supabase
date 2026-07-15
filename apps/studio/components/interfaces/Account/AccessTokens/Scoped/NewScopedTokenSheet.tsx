import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'ui'

import { countConfigured, selectionToScopes, type PermissionMode } from '../AccessToken.permissions'
import { useOrgAndProjectData } from '../hooks/useOrgAndProjectData'
import { PermissionsAccordion } from './Form/PermissionsAccordion'
import { ResourceAccessStep } from './Form/ResourceAccessStep'
import { ReviewStep } from './Form/ReviewStep'
import { StepIndicator } from './Form/StepIndicator'
import { TokenDetails } from './Form/TokenDetails'
import {
  DEFAULT_EXPIRY,
  EXPIRY_OPTIONS,
  getExpiryDate,
  TokenFormSchema,
  type TokenFormValues,
} from './Form/tokenForm'
import { TokenSuccess } from './Form/TokenSuccess'
import {
  useScopedAccessTokenCreateMutation,
  type NewScopedAccessToken,
  type ScopedAccessTokenCreateVariables,
} from '@/data/scoped-access-tokens/scoped-access-token-create-mutation'
import { useTrack } from '@/lib/telemetry/track'

export interface NewScopedTokenSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  onCreateToken: (token: NewScopedAccessToken) => void
}

const DEFAULT_VALUES: TokenFormValues = {
  tokenName: '',
  expiresAt: DEFAULT_EXPIRY,
  customExpiryDate: undefined,
  resourceAccess: 'single-project',
  organizationSlug: undefined,
  projectRef: undefined,
  accountConfirmed: false,
  permissions: {},
}

export const NewScopedTokenSheet = ({
  visible,
  onOpenChange,
  onCreateToken,
}: NewScopedTokenSheetProps) => {
  const track = useTrack()
  const { organizations, projects } = useOrgAndProjectData()
  const { mutate: createToken, isPending } = useScopedAccessTokenCreateMutation()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [resourceError, setResourceError] = useState<string | undefined>()
  const [showZeroWarning, setShowZeroWarning] = useState(false)
  const [createdToken, setCreatedToken] = useState<NewScopedAccessToken | undefined>()
  const resourceSectionRef = useRef<HTMLDivElement>(null)

  const form = useForm<TokenFormValues>({
    resolver: zodResolver(TokenFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  })

  const values = form.watch()
  const selection = values.permissions
  const configuredCount = countConfigured(selection)

  const validateResource = (): string | undefined => {
    if (values.resourceAccess === 'single-project') {
      if (!values.organizationSlug) return 'Please select an organization to continue.'
      if (!values.projectRef) return 'Please select a project to continue.'
    } else if (values.resourceAccess === 'organization') {
      if (!values.organizationSlug) return 'Please select an organization to continue.'
    } else if (values.resourceAccess === 'account') {
      if (!values.accountConfirmed) return 'Confirm account-level access to continue.'
    }
    return undefined
  }

  const handleReviewAccess = async () => {
    const nameValid = await form.trigger(['tokenName', 'customExpiryDate'])
    const resourceErr = validateResource()
    setResourceError(resourceErr)

    if (resourceErr) {
      resourceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!nameValid) return

    if (configuredCount === 0) setShowZeroWarning(true)
    setStep(2)
  }

  const handlePermissionChange = (key: string, mode: PermissionMode) => {
    form.setValue('permissions', { ...selection, [key]: mode })
    if (mode !== 'none') setShowZeroWarning(false)
  }

  const resourceSummary = (): string => {
    if (values.resourceAccess === 'single-project') {
      const project = projects.find((p) => p.ref === values.projectRef)
      return `Project: ${project?.name ?? values.projectRef ?? '—'}`
    }
    if (values.resourceAccess === 'organization') {
      const org = organizations.find((o) => o.slug === values.organizationSlug)
      return `Organization: ${org?.name ?? values.organizationSlug ?? '—'}`
    }
    return 'Account: Account-level access'
  }

  const expiresSummary = (): string => {
    if (values.expiresAt === 'custom') {
      return values.customExpiryDate
        ? dayjs(values.customExpiryDate).format('DD MMM, YYYY')
        : 'Custom — no date set'
    }
    return EXPIRY_OPTIONS.find((o) => o.value === values.expiresAt)?.label ?? values.expiresAt
  }

  const handleCreate = () => {
    const permissions = selectionToScopes(selection)
    if (permissions.length === 0) return

    const expires_at =
      values.expiresAt === 'custom' ? values.customExpiryDate : getExpiryDate(values.expiresAt)

    const payload: ScopedAccessTokenCreateVariables = {
      name: values.tokenName.trim(),
      permissions,
      ...(expires_at ? { expires_at } : {}),
      ...(values.resourceAccess === 'single-project' && values.projectRef
        ? { project_refs: [values.projectRef] }
        : {}),
      ...(values.resourceAccess === 'organization' && values.organizationSlug
        ? { organization_slugs: [values.organizationSlug] }
        : {}),
    }

    createToken(payload, {
      onSuccess: (data) => {
        track('access_token_created', {
          tokenType: 'scoped',
          expiryPreset: values.expiresAt,
          resourceAccess: values.resourceAccess,
          permissionCount: permissions.length,
        })
        toast.success('Access token created successfully')
        setCreatedToken(data)
        setStep(3)
        onCreateToken(data)
      },
    })
  }

  const reset = () => {
    form.reset(DEFAULT_VALUES)
    setStep(1)
    setResourceError(undefined)
    setShowZeroWarning(false)
    setCreatedToken(undefined)
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={visible} onOpenChange={(open) => (open ? onOpenChange(true) : handleClose())}>
      <SheetContent
        showClose={false}
        size="default"
        className="flex h-full min-w-[720px]! flex-col gap-0"
      >
        <SheetHeader>
          <SheetTitle>{step === 3 ? 'Token created' : 'Generate token'}</SheetTitle>
          <SheetDescription className="sr-only">
            Generate a new scoped access token in two steps: configure, then review.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {step === 3 && createdToken ? (
            <TokenSuccess tokenName={createdToken.name} tokenValue={createdToken.token} />
          ) : step === 2 ? (
            <ReviewStep
              values={values}
              resourceSummary={resourceSummary()}
              expiresSummary={expiresSummary()}
            />
          ) : (
            <Form {...form}>
              <TokenDetails form={form} />
              <Separator />
              <div ref={resourceSectionRef}>
                <ResourceAccessStep form={form} error={resourceError} />
              </div>
              <Separator />
              <PermissionsAccordion
                selection={selection}
                onChange={handlePermissionChange}
                showZeroWarning={showZeroWarning}
              />
            </Form>
          )}
        </ScrollArea>

        <SheetFooter className="mt-auto flex w-full items-center justify-between! border-t py-4">
          {step === 3 ? (
            <Button className="ml-auto" onClick={handleClose}>
              Done
            </Button>
          ) : (
            <>
              <StepIndicator step={step} total={2} label={step === 1 ? 'Configure' : 'Review'} />
              <div className="flex gap-2">
                {step === 2 && (
                  <Button variant="default" disabled={isPending} onClick={() => setStep(1)}>
                    Back
                  </Button>
                )}
                <Button variant="default" disabled={isPending} onClick={handleClose}>
                  Cancel
                </Button>
                {step === 1 ? (
                  <Button iconRight={<ChevronRight />} onClick={handleReviewAccess}>
                    Review access
                  </Button>
                ) : (
                  <Button
                    loading={isPending}
                    disabled={configuredCount === 0}
                    onClick={handleCreate}
                  >
                    Create token
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
