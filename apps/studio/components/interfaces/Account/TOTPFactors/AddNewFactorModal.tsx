import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useFlag, useUser } from 'common'
import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
} from 'ui'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import { RecoveryCodesModal } from './RecoveryCodesModal'
import InformationBox from '@/components/ui/InformationBox'
import { organizationKeys } from '@/data/organizations/keys'
import { useMfaChallengeAndVerifyMutation } from '@/data/profile/mfa-challenge-and-verify-mutation'
import { useMfaEnrollMutation } from '@/data/profile/mfa-enroll-mutation'
import { getMfaListFactors } from '@/data/profile/mfa-list-factors-query'
import { useMfaUnenrollMutation } from '@/data/profile/mfa-unenroll-mutation'
import { useRecoveryCodesGenerateMutation } from '@/data/recovery-codes/recovery-codes-generate-mutation'
import { useRecoveryCodesStatusQuery } from '@/data/recovery-codes/recovery-codes-status-query'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'

type TOTP = { qr_code: string; secret: string; uri: string }

interface AddNewFactorModalProps {
  visible: boolean
  onClose: () => void
  onComplete?: () => void
  onRecoveryCodesSaved?: () => void
}

export const AddNewFactorModal = ({
  visible,
  onClose,
  onComplete,
  onRecoveryCodesSaved,
}: AddNewFactorModalProps) => {
  const { data, mutate: enroll, isPending: isEnrolling, reset } = useMfaEnrollMutation()
  const enableAuthRecoveryCodes = useFlag('enableAuthRecoveryCodes')
  const userId = useUser()?.id
  const { isPending: isRecoveryCodesStatusPending, refetch: refetchRecoveryCodesStatus } =
    useRecoveryCodesStatusQuery({
      enabled: enableAuthRecoveryCodes,
      userId,
    })

  const recoveryCodesGenerateMutation = useRecoveryCodesGenerateMutation({
    onSettled: () => {
      handleClose()
      setIsRecoveryCodesModalOpen(true)
    },
  })

  const [isRecoveryCodesModalOpen, setIsRecoveryCodesModalOpen] = useState<boolean>(false)

  const [isBackupOfferOpen, setIsBackupOfferOpen] = useState(false)
  const [isBackupSetupOpen, setIsBackupSetupOpen] = useState(false)
  const isSetupVisible = visible || isBackupSetupOpen

  const handleClose = () => {
    setIsBackupSetupOpen(false)
    onClose()
  }

  const handleRecoveryCodesSaved = async () => {
    onRecoveryCodesSaved?.()
    try {
      const factors = await getMfaListFactors()
      const verifiedAuthenticators = factors.all.filter(
        (factor) => factor.status === 'verified' && factor.factor_type !== 'recovery_code'
      )
      if (verifiedAuthenticators.length === 1) setIsBackupOfferOpen(true)
    } catch {
      // The optional offer must not interrupt completed enrollment if this check fails.
    }
  }

  useEffect(() => {
    if (!isSetupVisible) reset()
  }, [reset, isSetupVisible])

  return (
    <>
      <FirstStep
        visible={isSetupVisible && !Boolean(data)}
        isEnrolling={isEnrolling || (enableAuthRecoveryCodes && isRecoveryCodesStatusPending)}
        enroll={enroll}
        reset={reset}
        onClose={handleClose}
      />
      <SecondStep
        visible={isSetupVisible && Boolean(data)}
        factorName={data?.friendly_name ?? ''}
        factor={data as Extract<typeof data, { type: 'totp' }>}
        isLoading={
          isEnrolling ||
          (enableAuthRecoveryCodes &&
            (isRecoveryCodesStatusPending || recoveryCodesGenerateMutation.isPending))
        }
        onClose={handleClose}
        onComplete={async () => {
          onComplete?.()
          if (enableAuthRecoveryCodes) {
            const { data: currentRecoveryCodesStatus } = await refetchRecoveryCodesStatus()
            const shouldGenerateRecoveryCodes = currentRecoveryCodesStatus?.status === 'unenrolled'

            if (shouldGenerateRecoveryCodes) {
              recoveryCodesGenerateMutation.mutate({})
              return
            }
          }
          handleClose()
        }}
      />
      <RecoveryCodesModal
        open={isRecoveryCodesModalOpen}
        onOpenChange={(open) => {
          setIsRecoveryCodesModalOpen(open)
          if (!open && recoveryCodesGenerateMutation.isSuccess) void handleRecoveryCodesSaved()
        }}
        mutation={recoveryCodesGenerateMutation}
      />
      <Dialog open={isBackupOfferOpen} onOpenChange={setIsBackupOfferOpen}>
        <DialogContent size="small" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Add a backup authenticator?</DialogTitle>
          </DialogHeader>
          <DialogSection>
            <p className="text-sm text-foreground-light">
              Your recovery codes are saved. Add an authenticator on another device as a backup if
              you lose access to your main device.
            </p>
          </DialogSection>
          <DialogFooter>
            <Button variant="default" onClick={() => setIsBackupOfferOpen(false)}>
              Not now
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsBackupOfferOpen(false)
                reset()
                setIsBackupSetupOpen(true)
              }}
            >
              Add another
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface FirstStepProps {
  visible: boolean
  isEnrolling: boolean
  reset: () => void
  enroll: (params: { factorType: 'totp'; friendlyName?: string }) => void
  onClose: () => void
}

const ENROLL_FORM_ID = 'add-totp-factor-form'

const EnrollFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
})
type EnrollFormValues = z.infer<typeof EnrollFormSchema>

const enrollFormDefaultValues: EnrollFormValues = { name: '' }

const FirstStep = ({ visible, isEnrolling, enroll, onClose }: FirstStepProps) => {
  const form = useForm<EnrollFormValues>({
    resolver: zodResolver(EnrollFormSchema),
    defaultValues: enrollFormDefaultValues,
    mode: 'onChange',
  })

  const onSubmit: SubmitHandler<EnrollFormValues> = async (values) => {
    enroll({ factorType: 'totp', friendlyName: values.name })
  }

  useEffect(() => {
    if (visible) form.reset(enrollFormDefaultValues)
  }, [form, visible])

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      title="Add a new authenticator app as a factor"
      confirmLabel="Generate QR"
      confirmLabelLoading="Generating QR"
      loading={isEnrolling}
      onCancel={onClose}
      onConfirm={form.handleSubmit(onSubmit)}
    >
      <Form {...form}>
        <form
          id={ENROLL_FORM_ID}
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            key="name"
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItemLayout
                name="name"
                label="Authenticator app name"
                description="Used to identify the app in your account settings and during sign-in."
              >
                <FormControl>
                  <Input placeholder="e.g.: Google Authenticator" autoFocus {...field} />
                </FormControl>
              </FormItemLayout>
            )}
          />
        </form>
      </Form>
    </ConfirmationModal>
  )
}

interface SecondStepProps {
  visible: boolean
  factorName: string
  factor?: {
    id: string
    type: 'totp'
    totp: TOTP
  }
  isLoading: boolean
  onClose: () => void
  onComplete: () => void
}

const SecondStep = ({
  visible,
  factorName,
  factor: outerFactor,
  isLoading,
  onClose,
  onComplete,
}: SecondStepProps) => {
  const queryClient = useQueryClient()
  const { lastVisitedOrganization } = useLastVisitedOrganization()

  const FormSchema = z.object({
    code: z.string().min(1, 'Please provide a code from your authenticator app'),
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { code: '' },
    mode: 'onChange',
  })

  const [factor, setFactor] = useState<{ id: string; type: 'totp'; totp: TOTP } | null>(null)

  const { mutate: unenroll } = useMfaUnenrollMutation({ onSuccess: () => onClose() })
  const { mutate: challengeAndVerify, isPending: isVerifying } = useMfaChallengeAndVerifyMutation({
    onError: (error) => {
      toast.error(`Failed to add a second factor authentication:  ${error?.message}`)
    },
    onSuccess: async () => {
      if (lastVisitedOrganization) {
        await queryClient.invalidateQueries({
          queryKey: organizationKeys.members(lastVisitedOrganization),
        })
      }
      toast.success(`Successfully added a second factor authentication`)
      onComplete()
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    if (!factor) return toast.error('Factor required')
    challengeAndVerify({ factorId: factor.id, code: values.code })
  }

  // this useEffect is to keep the factor until a new one comes. This is a fix to an issue which
  // happens when closing the modal, the outer factor is reset to null too soon and the modal
  // removes a big div mid transition.
  useEffect(() => {
    if (outerFactor && factor?.id !== outerFactor.id) {
      setFactor(outerFactor)
      form.reset({ code: '' })
    }
  }, [outerFactor, factor?.id, form])

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      className="py-5"
      title={`Verify new factor ${factorName}`}
      confirmLabel="Confirm"
      confirmLabelLoading="Confirming"
      loading={isVerifying || isLoading}
      onCancel={() => {
        // If a factor has been created (but not verified), unenroll it. This will be run as a
        // side effect so that it's not confusing to the user why the modal stays open while
        // unenrolling.
        if (factor) unenroll({ factorId: factor.id })
      }}
      onConfirm={form.handleSubmit(onSubmit)}
    >
      <p className="text-sm">
        Use an authenticator app to scan the following QR code, and provide the code from the app to
        complete the enrolment.
      </p>

      {!factor && (
        <div className="pb-4 px-4">
          <GenericSkeletonLoader />
        </div>
      )}

      {factor && (
        <div className="flex flex-col gap-y-4">
          <div className="flex justify-center py-6">
            <div className="h-48 w-48 bg-white rounded-sm">
              <img width={190} height={190} src={factor.totp.qr_code} alt={factor.totp.uri} />
            </div>
          </div>

          <InformationBox
            title="Unable to scan?"
            description={
              <FormItemLayout
                isReactForm={false}
                label="You can also enter this secret key into your authenticator app"
              >
                <PasswordInput copy disabled id="ref" size="small" value={factor.totp.secret} />
              </FormItemLayout>
            }
          />

          <Form {...form}>
            <form
              id="verify-otp-form"
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                key="code"
                name="code"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Authentication code">
                    <FormControl>
                      <Input autoFocus {...field} placeholder="XXXXXX" className="font-mono" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form>
        </div>
      )}
    </ConfirmationModal>
  )
}
