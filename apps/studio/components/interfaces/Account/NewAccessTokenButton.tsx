import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAccessTokenCreateMutation } from 'data/access-tokens/access-tokens-create-mutation'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form_Shadcn_,
  cn,
} from 'ui'
import { Admonition } from 'ui-patterns'

import {
  Step1BasicInfo,
  Step2ResourceAccess,
  Step3Permissions,
  Step4TokenGenerated,
} from './NewAccessTokenSteps'

// For prototyping purposes
import {
  ACCESS_TOKEN_PERMISSIONS,
} from './AccessToken.constants'

export interface NewAccessTokenButtonProps {
  onCreateToken: (token: any) => void
}



const PermissionRowSchema = z.object({
  resource: z.string().min(1, 'Please select a resource'),
  action: z.string().min(1, 'Please select an action'),
})

const TokenSchema = z.object({
  tokenName: z.string().min(1, 'Please enter a name for the token'),
  expirationDate: z.enum(['No expiry', '7 days', '30 days', '90 days', '180 days']),
  resourceAccess: z.enum(['all-orgs', 'selected-orgs', 'selected-projects']),
  selectedOrganizations: z.array(z.string()).optional(),
  selectedProjects: z.array(z.string()).optional(),
  organizationPermissions: z.record(z.string(), z.string()).optional(),
  projectPermissions: z.record(z.string(), z.string()).optional(),
  permissionRows: z.array(PermissionRowSchema).optional(),
})

const NewAccessTokenButton = ({ onCreateToken }: NewAccessTokenButtonProps) => {
  const [visible, setVisible] = useState(false)
  const [tokenScope, setTokenScope] = useState<'V0' | undefined>(undefined)
  const [currentStep, setCurrentStep] = useState(1)
  const [generatedToken, setGeneratedToken] = useState<any>(null)
  const [resourceSearchOpen, setResourceSearchOpen] = useState(false)

  const form = useForm<z.infer<typeof TokenSchema>>({
    resolver: zodResolver(TokenSchema),
    defaultValues: {
      tokenName: '',
      expirationDate: 'No expiry',
      resourceAccess: 'all-orgs',
      selectedOrganizations: [],
      selectedProjects: [],
      organizationPermissions: {},
      projectPermissions: {},
      permissionRows: [],
    },
    mode: 'onSubmit',
  })
  const { mutate: createAccessToken, isLoading } = useAccessTokenCreateMutation()

  const resourceAccess = form.watch('resourceAccess')
  const expirationDate = form.watch('expirationDate')
  const permissionRows = form.watch('permissionRows') || []

  // Calculate expiration date for display
  const getExpirationDateText = (expiryOption: string) => {
    if (expiryOption === 'No expiry') return 'Token never expires'

    const now = new Date()
    let expirationDate: Date

    switch (expiryOption) {
      case '7 days':
        expirationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case '30 days':
        expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      case '90 days':
        expirationDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        break
      case '180 days':
        expirationDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
        break
      default:
        return 'Token never expires'
    }

    return `Token expires ${expirationDate.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}`
  }

  const onSubmit: SubmitHandler<z.infer<typeof TokenSchema>> = async (values) => {
    createAccessToken(
      { name: values.tokenName, scope: tokenScope },
      {
        onSuccess: (data) => {
          setGeneratedToken(data)
          setCurrentStep(4)
          onCreateToken(data)
        },
      }
    )
  }

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1 fields before proceeding
      const step1Fields = ['tokenName', 'expirationDate'] as const
      const isValid = step1Fields.every((field) => {
        const value = form.getValues(field)
        return value
      })

      if (isValid) {
        setCurrentStep(2)
      } else {
        form.trigger(step1Fields)
      }
    } else if (currentStep === 2) {
      // Validate step 2 fields before proceeding
      const step2Fields = ['resourceAccess'] as const
      const isValid = step2Fields.every((field) => {
        const value = form.getValues(field)
        return value
      })

      // Additional validation for selected organizations/projects based on resource access
      const selectedItemsValid =
        resourceAccess === 'all-orgs' ||
        (resourceAccess === 'selected-orgs' &&
          (form.getValues('selectedOrganizations') || []).length > 0) ||
        (resourceAccess === 'selected-projects' &&
          (form.getValues('selectedProjects') || []).length > 0)

      if (isValid && selectedItemsValid) {
        setCurrentStep(3)
      } else {
        form.trigger(step2Fields)
      }
    } else if (currentStep === 3) {
      // Validate step 3 - at least one permission row should be configured
      const permissionRows = form.getValues('permissionRows') || []
      const hasValidPermissions =
        permissionRows.length > 0 && permissionRows.every((row) => row.resource && row.action)

      if (hasValidPermissions) {
        setCurrentStep(4)
      } else {
        toast.error(
          'Please configure at least one permission with both resource and action selected.'
        )
      }
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleClose = () => {
    form.reset({
      tokenName: '',
      expirationDate: 'No expiry',
      resourceAccess: 'all-orgs',
      selectedOrganizations: [],
      selectedProjects: [],
      organizationPermissions: {},
      projectPermissions: {},
      permissionRows: [],
    })
    setVisible(false)
    setCurrentStep(1)
    setGeneratedToken(null)
  }

  const handleDismiss = () => {
    handleClose()
  }

  return (
    <>
      <div className="flex items-center">
        <Button
          className="rounded-r-none px-3"
          onClick={() => {
            setTokenScope(undefined)
            setVisible(true)
          }}
        >
          Generate new token
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="primary"
              title="Choose token scope"
              className="rounded-l-none px-[4px] py-[5px]"
              icon={<ChevronDown />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem
              key="experimental-token"
              onClick={() => {
                setTokenScope('V0')
                setVisible(true)
              }}
            >
              <div className="space-y-1">
                <p className="block text-foreground">Generate token for experimental API</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog
        open={visible}
        onOpenChange={(open) => {
          if (!open) handleClose()
          setVisible(open)
        }}
      >
        <DialogContent className="max-w-2xl overflow-visible">
          <DialogHeader>
            <DialogTitle>
              {currentStep === 4
                ? 'Token Generated Successfully'
                : tokenScope === 'V0'
                  ? 'Generate token for experimental API'
                  : 'Generate New Token'}
            </DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection className="flex flex-col gap-4 overflow-visible">
            {tokenScope === 'V0' && (
              <Admonition
                type="warning"
                title="The experimental API provides additional endpoints which allows you to manage your organizations and projects."
                description={
                  <>
                    <p>
                      These include deleting organizations and projects which cannot be undone. As
                      such, be very careful when using this API.
                    </p>
                    <div className="mt-4">
                      <Button asChild type="default" icon={<ExternalLink />}>
                        <Link
                          href="https://api.supabase.com/api/v0"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Experimental API documentation
                        </Link>
                      </Button>
                    </div>
                  </>
                }
              />
            )}
            <Form_Shadcn_ {...form}>
              <div className="flex flex-col gap-4 overflow-visible">
                {currentStep === 1 && (
                  <Step1BasicInfo
                    control={form.control}
                    getExpirationDateText={getExpirationDateText}
                    expirationDate={expirationDate}
                  />
                )}

                {currentStep === 2 && (
                  <Step2ResourceAccess
                    control={form.control}
                    resourceAccess={resourceAccess}
                  />
                )}

                {currentStep === 3 && (
                  <Step3Permissions
                    control={form.control}
                    permissionRows={permissionRows}
                    resourceSearchOpen={resourceSearchOpen}
                    setResourceSearchOpen={setResourceSearchOpen}
                    form={form}
                    onSubmit={form.handleSubmit(onSubmit)}
                    isLoading={isLoading}
                  />
                )}

                {currentStep === 4 && (
                  <Step4TokenGenerated
                    generatedToken={generatedToken}
                    onCopy={() => toast.success('Access token copied to clipboard')}
                  />
                )}
              </div>
            </Form_Shadcn_>
          </DialogSection>
          {currentStep < 4 && (
            <DialogFooter className="!justify-between w-full">
              {/* Step indicator */}
              <div className="flex items-center gap-2 text-xs text-foreground-light">
                <div className="flex gap-1.5">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-sm',
                      currentStep > 1
                        ? 'bg-brand-button'
                        : currentStep === 1
                          ? 'bg-brand-link'
                          : 'bg-border'
                    )}
                  />
                  <div
                    className={cn(
                      'w-2 h-2 rounded-sm',
                      currentStep > 2
                        ? 'bg-brand-button'
                        : currentStep === 2
                          ? 'bg-brand-link'
                          : 'bg-border'
                    )}
                  />
                  <div
                    className={cn(
                      'w-2 h-2 rounded-sm',
                      currentStep > 3
                        ? 'bg-brand-button'
                        : currentStep === 3
                          ? 'bg-brand-link'
                          : 'bg-border'
                    )}
                  />
                </div>
                <span>Step {currentStep === 4 ? 3 : currentStep} of 3</span>
              </div>

              <div className="flex gap-2">
                {currentStep === 1 ? (
                  <>
                    <Button type="default" disabled={isLoading} onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="default" onClick={handleNext} iconRight={<ChevronRight />}>
                      Set access
                    </Button>
                  </>
                ) : currentStep === 2 ? (
                  <>
                    <Button type="default" onClick={handleBack} icon={<ChevronLeft />}>
                      Back
                    </Button>
                    <Button type="default" onClick={handleNext} iconRight={<ChevronRight />}>
                      Set permissions
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="default" onClick={handleBack} icon={<ChevronLeft />}>
                      Back
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)} loading={isLoading}>
                      Generate token
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default NewAccessTokenButton
