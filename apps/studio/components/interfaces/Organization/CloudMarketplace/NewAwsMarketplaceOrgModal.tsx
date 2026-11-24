import { useRef } from 'react'
import { SubmitHandler } from 'react-hook-form'
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
} from 'ui'

import {
  CREATE_AWS_MANAGED_ORG_FORM_ID,
  NewAwsMarketplaceOrgForm,
  type NewMarketplaceOrgForm,
} from './NewAwsMarketplaceOrgForm'
import { ORG_KIND_DEFAULT } from '@/components/interfaces/OnboardingSurvey/OnboardingSurvey.constants'
import {
  useOnboardingSurveyMutation,
  type OnboardingSurveyVariables,
} from '@/data/organizations/onboarding-survey-mutation'
import { useAwsManagedOrganizationCreateMutation } from '@/data/organizations/organization-create-mutation'

interface Props {
  buyerId: string
  visible: boolean
  onSuccess: (newlyCreatedOrgSlug: string) => void
  onClose: () => void
}

export const NewAwsMarketplaceOrgModal = ({ buyerId, visible, onSuccess, onClose }: Props) => {
  const surveyAnswers = useRef<Omit<OnboardingSurveyVariables, 'slug'> | null>(null)
  const { mutate: submitOnboardingSurvey } = useOnboardingSurveyMutation()
  const { mutate: createOrganization, isPending: isCreatingOrganization } =
    useAwsManagedOrganizationCreateMutation({
      onSuccess: (org) => {
        //TODO(thomas): send tracking event?
        if (surveyAnswers.current) {
          submitOnboardingSurvey({ slug: org.slug, ...surveyAnswers.current })
        }
        onSuccess(org.slug)
      },
      onError: (res) => {
        toast.error(res.message, {
          duration: 7_000,
        })
      },
    })

  const onSubmit: SubmitHandler<NewMarketplaceOrgForm> = async (values) => {
    const { kind, building, can_code } = values
    const size = kind === 'COMPANY' ? values.size : undefined
    // Kind always holds a value, so it only counts as answered when changed
    const hasSurveyAnswer = kind !== ORG_KIND_DEFAULT || building !== '' || can_code !== ''
    surveyAnswers.current = hasSurveyAnswer ? { kind, size, building, can_code } : null

    // Kind and size go to the survey endpoint only. It keeps the first response per user
    // and org, so sending them at creation too would drop the other answers.
    createOrganization({ name: values.name, buyerId })
  }

  return (
    <AwsMarketplaceOrgCreationDialog
      visible={visible}
      onClose={onClose}
      onSubmit={onSubmit}
      isCreatingOrganization={isCreatingOrganization}
    />
  )
}

const AwsMarketplaceOrgCreationDialog = ({
  visible,
  onClose,
  onSubmit,
  isCreatingOrganization = false,
}: {
  visible: boolean
  onClose: () => void
  onSubmit: SubmitHandler<NewMarketplaceOrgForm>
  isCreatingOrganization?: boolean
}) => {
  const handleClose = () => {
    if (!isCreatingOrganization) onClose()
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        size="medium"
        onEscapeKeyDown={(e) => {
          if (isCreatingOrganization) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (isCreatingOrganization) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Create and link organization</DialogTitle>
          <DialogDescription className="text-balance">
            A new organization will be created and linked to your AWS Marketplace subscription
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <NewAwsMarketplaceOrgForm onSubmit={onSubmit} />
        </DialogSection>
        <DialogFooter>
          <Button
            variant="primary"
            form={CREATE_AWS_MANAGED_ORG_FORM_ID}
            type="submit"
            loading={isCreatingOrganization}
          >
            Create and link organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
