import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS } from 'common'
import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { Form, FormControl, FormField, Input_Shadcn_ } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import InformationBox from '@/components/ui/InformationBox'
import { organizationKeys } from '@/data/organizations/keys'
import { useMfaChallengeAndVerifyMutation } from '@/data/profile/mfa-challenge-and-verify-mutation'
import { useMfaEnrollMutation } from '@/data/profile/mfa-enroll-mutation'
import { useMfaUnenrollMutation } from '@/data/profile/mfa-unenroll-mutation'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

type TOTP = { qr_code: string; secret: string; uri: string }

interface AddNewFactorModalProps {
  visible: boolean
  onClose: () => void
}

export const AddNewFactorModal = ({ visible, onClose }: AddNewFactorModalProps) => {
  const { data, mutate: enroll, isPending: isEnrolling, reset } = useMfaEnrollMutation()

  useEffect(() => {
    if (!visible) reset()
  }, [reset, visible])

  return (
    <>
      <FirstStep
        visible={visible && !Boolean(data)}
        isEnrolling={isEnrolling}
        enroll={enroll}
        reset={reset}
        onClose={onClose}
      />
      <SecondStep
        visible={visible && Boolean(data)}
        factorName={data?.friendly_name ?? ''}
        factor={data as Extract<typeof data, { type: 'totp' }>}
        isLoading={isEnrolling}
        onClose={onClose}
      />
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

const FirstStep = ({ visible, isEnrolling, enroll, onClose }: FirstStepProps) => {
  const FormSchema = z.object({
    name: z.string().min(1, 'Please provide a name to identify this app'),
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '' },
    mode: 'onChange',
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    enroll({ factorType: 'totp', friendlyName: values.name })
  }

  useEffect(() => {
    if (!visible) {
      // Generate a name with a number between 0 and 1000
      form.reset({ name: `App ${Math.floor(Math.random() * 1000)}` })
    }
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
          id="verify-otp-form"
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
                label="Provide a name to identify this app"
                description="A string will be randomly generated if a name is not provided"
              >
                <FormControl>
                  <Input_Shadcn_ id="name" {...field} />
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
}

const SecondStep = ({
  visible,
  factorName,
  factor: outerFactor,
  isLoading,
  onClose,
}: SecondStepProps) => {
  const queryClient = useQueryClient()
  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

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
      onClose()
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
  }, [outerFactor])

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      className="py-5"
      title={`Verify new factor ${factorName}`}
      confirmLabel="Confirm"
      confirmLabelLoading="Confirming"
      loading={isVerifying}
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

      {isLoading && (
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
                <Input copy disabled id="ref" size="small" value={factor.totp.secret} />
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
                  <FormItemLayout name="code" label="Authentication code">
                    <FormControl>
                      <Input_Shadcn_
                        id="code"
                        autoFocus
                        {...field}
                        placeholder="XXXXXX"
                        className="font-mono"
                      />
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
