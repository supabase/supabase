import { useState } from 'react'
import { toast } from 'sonner'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { InlineLink } from 'components/ui/InlineLink'
import { useDpaRequestMutation } from 'data/documents/dpa-request-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'
import { Button } from 'ui'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

export const DPA = () => {
  const { profile } = useProfile()
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug

  const [isOpen, setIsOpen] = useState(false)

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: requestDpa, isLoading: isRequesting } = useDpaRequestMutation({
    onSuccess: () => {
      toast.success('DPA request sent successfully')
      setIsOpen(false)
    },
  })

  const onConfirmRequest = async () => {
    if (!slug) return toast.error('Organization not found.')
    if (!profile?.primary_email) return toast.error('Profile email not found.')
    requestDpa({ recipient_email: profile?.primary_email, slug: slug })
  }

  return (
    <>
      <ScaffoldSection>
        <ScaffoldSectionDetail className="sticky space-y-6 top-12">
          <p className="text-base m-0">Data Processing Addendum (DPA)</p>
          <div className="space-y-2 text-sm text-foreground-light m-0">
            <p>
              All organizations can sign our Data Processing Addendum ("DPA") as part of their GDPR
              compliance.
            </p>
            <p>
              You can review a static PDF version of our latest DPA document{' '}
              <InlineLink
                href="https://supabase.com/downloads/docs/Supabase+DPA+250805.pdf"
                onClick={() =>
                  sendEvent({
                    action: 'dpa_pdf_opened',
                    properties: { source: 'studio' },
                  })
                }
              >
                here
              </InlineLink>
              .
            </p>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent className="flex items-center justify-center h-full">
          <Button
            onClick={() => {
              setIsOpen(true)
              sendEvent({
                action: 'dpa_request_button_clicked',
              })
            }}
            type="default"
          >
            Request DPA
          </Button>
        </ScaffoldSectionContent>
      </ScaffoldSection>

      <TextConfirmModal
        visible={isOpen}
        title="Request executable DPA to sign"
        loading={isRequesting}
        confirmPlaceholder="Enter your email address"
        confirmString={profile?.primary_email ?? ''}
        confirmLabel="Send DPA request"
        errorMessage="Email must match your account email."
        onCancel={() => setIsOpen(false)}
        onConfirm={() => onConfirmRequest()}
      >
        <div className="space-y-2 text-sm">
          <p>
            To make the DPA legally binding, you need to sign and complete the details through a
            PandaDoc document that we prepare.
          </p>
          <p>
            Please enter your email address to request an executable version of the DPA. You will
            receive a document link via PandaDoc in the next 24 hours.
          </p>
          <p>
            Once signed, the DPA will be considered executed and you'll be notified of any future
            updates via this email.
          </p>
        </div>
      </TextConfirmModal>
    </>
  )
}
