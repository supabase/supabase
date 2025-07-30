import { useState } from 'react'
import { toast } from 'sonner'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { useDpaRequestMutation } from 'data/documents/dpa-request-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useProfile } from 'lib/profile'
import { Button, Form, Input, Modal } from 'ui'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

const DPA = () => {
  const { profile } = useProfile()
  const organization = useSelectedOrganization()
  const slug = organization?.slug
  const { mutate: sendEvent } = useSendEventMutation()

  const [isOpen, setIsOpen] = useState(false)

  const { mutate: requestDpa, isLoading: isRequesting } = useDpaRequestMutation({
    onSuccess: () => {
      toast.success('DPA request sent successfully')
      setIsOpen(false)
    },
  })

  const onValidate = (values: any) => {
    const errors: any = {}
    if (!values.email) {
      errors.email = 'Enter your email address.'
    }
    if (values.email.trim() !== profile?.primary_email?.trim()) {
      errors.email = 'Email must match your account email.'
    }
    return errors
  }

  const onConfirmRequest = async (values: any) => {
    if (!slug) {
      toast.error('Organization not found.')
      return
    }
    requestDpa({ recipientEmail: values.email, slug: slug })
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
              <a
                href="https://supabase.com/downloads/docs/Supabase+DPA+250314.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
                onClick={() =>
                  sendEvent({
                    action: 'dpa_pdf_opened',
                    properties: { source: 'studio' },
                  })
                }
              >
                here
              </a>
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
      <Modal
        hideFooter
        size="small"
        visible={isOpen}
        onCancel={() => setIsOpen(false)}
        header={
          <div className="flex items-baseline gap-2">
            <span>Request executable DPA to sign</span>
          </div>
        }
      >
        <Form
          validateOnBlur
          initialValues={{ email: '' }}
          onSubmit={onConfirmRequest}
          validate={onValidate}
        >
          {() => (
            <>
              <Modal.Content>
                <div className="space-y-2 text-sm text-foreground-lighter">
                  <p>
                    To make the DPA legally binding, you need to sign and complete the details
                    through a PandaDoc document that we prepare.
                  </p>
                  <p>
                    Please enter your email address to request an executable version of the DPA. You
                    will receive a document link via PandaDoc in the next 24 hours.
                  </p>
                  <p>
                    Once signed, the DPA will be considered executed and you'll be notified of any
                    future updates via this email.
                  </p>
                </div>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <Input
                  id="email"
                  label={
                    <span>
                      Please enter <span className="font-bold">{profile?.primary_email}</span> to
                      confirm
                    </span>
                  }
                  placeholder="Enter your email address"
                  className="w-full"
                />
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <Button
                  block
                  size="small"
                  type="primary"
                  htmlType="submit"
                  loading={isRequesting}
                  disabled={isRequesting}
                >
                  Send DPA Request
                </Button>
              </Modal.Content>
            </>
          )}
        </Form>
      </Modal>
    </>
  )
}

export default DPA
