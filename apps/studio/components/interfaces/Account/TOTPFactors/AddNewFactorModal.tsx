import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import InformationBox from 'components/ui/InformationBox'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useMfaChallengeAndVerifyMutation } from 'data/profile/mfa-challenge-and-verify-mutation'
import { useMfaEnrollMutation } from 'data/profile/mfa-enroll-mutation'
import { useMfaUnenrollMutation } from 'data/profile/mfa-unenroll-mutation'

interface AddNewFactorModalProps {
  visible: boolean
  onClose: () => void
}

const AddNewFactorModal = ({ visible, onClose }: AddNewFactorModalProps) => {
  // Generate a name with a number between 0 and 1000
  const [name, setName] = useState(`App ${Math.floor(Math.random() * 1000)}`)
  const { data, mutate: enroll, isLoading: isEnrolling, reset } = useMfaEnrollMutation()

  useEffect(() => {
    // reset has to be called because the state is kept between if the process is canceled during
    // the second step.
    if (!visible) {
      setName(`App ${Math.floor(Math.random() * 1000)}`)
      reset()
    }
  }, [reset, visible])

  return (
    <>
      <FirstStep
        visible={visible && !Boolean(data)}
        name={name}
        setName={setName}
        enroll={enroll}
        isEnrolling={isEnrolling}
        onClose={onClose}
      />
      <SecondStep
        visible={visible && Boolean(data)}
        factorName={name}
        factor={data!}
        isLoading={isEnrolling}
        onSuccess={() => onClose()}
        onClose={onClose}
      />
    </>
  )
}

interface FirstStepProps {
  visible: boolean
  name: string
  setName: Dispatch<SetStateAction<string>>
  enroll: (params: { factorType: 'totp'; friendlyName?: string }) => void
  isEnrolling: boolean
  onClose: () => void
}

const FirstStep = ({ visible, name, enroll, setName, isEnrolling, onClose }: FirstStepProps) => {
  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      title="Add a new authenticator app as a factor"
      confirmLabel="Generate QR"
      confirmLabelLoading="Generating QR"
      disabled={name.length === 0}
      loading={isEnrolling}
      onCancel={onClose}
      onConfirm={() => {
        enroll({
          factorType: 'totp',
          friendlyName: name,
        })
      }}
    >
      <Input
        label="Provide a name to identify this app"
        descriptionText="A string will be randomly generated if a name is not provided"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </ConfirmationModal>
  )
}

interface SecondStepProps {
  visible: boolean
  factorName: string
  factor?: {
    id: string
    type: 'totp'
    totp: {
      qr_code: string
      secret: string
      uri: string
    }
  }
  isLoading: boolean
  onSuccess: () => void
  onClose: () => void
}

const SecondStep = ({
  visible,
  factorName,
  factor: outerFactor,
  isLoading,
  onSuccess,
  onClose,
}: SecondStepProps) => {
  const [code, setCode] = useState('')

  const { mutate: unenroll } = useMfaUnenrollMutation({ onSuccess: () => onClose() })
  const { mutate: challengeAndVerify, isLoading: isVerifying } = useMfaChallengeAndVerifyMutation({
    onError: (error) => {
      toast.error(`Failed to add a second factor authentication:  ${error?.message}`)
    },
    onSuccess: () => {
      toast.success(`Successfully added a second factor authentication`)
      onSuccess()
    },
  })

  const [factor, setFactor] = useState<{
    id: string
    type: 'totp'
    totp: {
      qr_code: string
      secret: string
      uri: string
    }
  } | null>(null)

  // this useEffect is to keep the factor until a new one comes. This is a fix to an issue which
  // happens when closing the modal, the outer factor is reset to null too soon and the modal
  // removes a big div mid transition.
  useEffect(() => {
    if (outerFactor && factor?.id !== outerFactor.id) {
      setFactor(outerFactor)
    }
  }, [outerFactor])

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
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
      onConfirm={() => factor && challengeAndVerify({ factorId: factor.id, code })}
    >
      <>
        <div className="py-4 pb-0 text-sm">
          <span>
            Use an authenticator app to scan the following QR code, and provide the code from the
            app to complete the enrolment.
          </span>
        </div>
        {isLoading && (
          <div className="pb-4 px-4">
            <GenericSkeletonLoader />
          </div>
        )}
        {factor && (
          <>
            <div className="flex justify-center py-6">
              <div className="h-48 w-48 bg-white rounded">
                <img width={190} height={190} src={factor.totp.qr_code} alt={factor.totp.uri} />
              </div>
            </div>
            <div>
              <InformationBox
                title="Unable to scan?"
                description={
                  <Input
                    copy
                    disabled
                    id="ref"
                    size="small"
                    label="You can also enter this secret key into your authenticator app"
                    value={factor.totp.secret}
                  />
                }
              />
            </div>
            <div className="pt-2 pb-4">
              <Input
                label="Authentication code"
                value={code}
                placeholder="XXXXXX"
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </>
        )}
      </>
    </ConfirmationModal>
  )
}

export default AddNewFactorModal
