import { PermissionAction } from '@supabase/shared-types/out/constants'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  RadioGroupStacked,
  RadioGroupStackedItem,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useOrganizationCustomerProfileUpdateMutation } from '@/data/organizations/organization-customer-profile-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'

type IndirectTaxDeclaration = 'yes' | 'no'

export const IndirectTaxDeclarationModal = () => {
  const { data: organization } = useSelectedOrganizationQuery({ enabled: IS_PLATFORM })

  const [response, setResponse] = useState<IndirectTaxDeclaration | ''>('')
  const [hasSubmittedDeclaration, setHasSubmittedDeclaration] = useState(false)

  const [submitIndirectTaxDeclaration, setSubmitIndirectTaxDeclaration] = useQueryState(
    'submit_indirect_tax_declaration',
    parseAsBoolean.withDefault(false)
  )

  useEffect(() => {
    setResponse('')
    setHasSubmittedDeclaration(false)
  }, [organization?.slug])

  const { can: canUpdateBillingInfo, isSuccess: permissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.customer'
  )

  const { mutate: updateCustomerProfile, isPending } = useOrganizationCustomerProfileUpdateMutation(
    {
      onSuccess: () => {
        toast.success('GST declaration submitted')
      },
      onError: (error) => {
        toast.error(`Failed to submit GST declaration: ${error.message}`)
      },
    }
  )

  const canViewDeclaration =
    IS_PLATFORM && organization !== undefined && permissionsLoaded && canUpdateBillingInfo

  let declarationModal: 'form' | 'submitted' | null = null

  if (canViewDeclaration) {
    if (organization.requires_indirect_tax_declaration) {
      declarationModal = 'form'
    } else if (submitIndirectTaxDeclaration && !hasSubmittedDeclaration) {
      declarationModal = 'submitted'
    }
  }

  const onSubmit = () => {
    if (organization?.slug === undefined || response === '') return

    setHasSubmittedDeclaration(true)
    setSubmitIndirectTaxDeclaration(null)

    updateCustomerProfile({
      slug: organization.slug,
      indirect_tax_registration_declaration: response,
    })
  }

  return (
    <>
      <Dialog open={declarationModal === 'form'}>
        <DialogContent
          size="medium"
          hideClose
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Confirm your Australian GST status</DialogTitle>
            <DialogDescription>
              Confirm the following for your organization {organization?.name}
            </DialogDescription>
          </DialogHeader>
          <DialogSectionSeparator />

          <DialogSection className="py-4">
            <RadioGroupStacked
              className="[&_p]:text-pretty"
              value={response}
              onValueChange={(value) => {
                if (value === 'yes' || value === 'no') setResponse(value)
              }}
            >
              <RadioGroupStackedItem
                value="yes"
                label="Yes, I confirm"
                description="We are and were registered for GST in Australia when we acquired services from Supabase, and the services were acquired solely or partly in the course or furtherance of our business."
              />
              <RadioGroupStackedItem
                value="no"
                label="No, I do not confirm"
                description="We are or were not registered for GST in Australia when we acquired services from Supabase, or the services were acquired for a purpose unrelated to our business."
              />
            </RadioGroupStacked>
          </DialogSection>

          <DialogFooter>
            <ButtonTooltip
              onClick={onSubmit}
              disabled={response === ''}
              loading={isPending}
              tooltip={{
                content: {
                  side: 'top',
                  text: response === '' ? 'Select Yes or No to continue' : undefined,
                },
              }}
            >
              Submit declaration
            </ButtonTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={declarationModal === 'submitted'}
        onOpenChange={(open) => {
          if (!open) setSubmitIndirectTaxDeclaration(null)
        }}
      >
        <DialogContent size="small">
          <DialogHeader>
            <DialogTitle>GST declaration already submitted</DialogTitle>
            <DialogDescription>
              The GST declaration for {organization?.name} has already been submitted. No further
              action is required.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSubmitIndirectTaxDeclaration(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
