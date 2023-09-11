import { useParams } from 'common'
import { urlRegex } from 'components/interfaces/Auth/Auth.constants'
import { useJwtSecretUpdateMutation } from 'data/config/jwt-secret-update-mutation'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { Button, Form, Input, Modal, Radio } from 'ui'
import { object, string } from 'yup'

const newUrlSchema = object({
  type: string().oneOf(['openId', 'jwks']).required(),
  url: string().matches(urlRegex, 'URL is not valid').required(),
})

interface AddNewUrlModalProps {
  visible: boolean
  onClose: () => void
}

export const AddNewUrlModal = ({ visible, onClose }: AddNewUrlModalProps) => {
  const INITIAL_VALUES = { url: '', type: 'openId' } as const
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const { data: postgrestConfig } = useProjectPostgrestConfigQuery({
    projectRef,
  })
  const { mutate: updateJwt, isLoading: isSubmittingJwtSecretUpdateRequest } =
    useJwtSecretUpdateMutation({
      onSuccess: () => {
        ui.setNotification({
          category: 'success',
          message: 'Successfully added custom JWKS JSON.',
        })
        onClose()
      },
      onError: (error) => {
        ui.setNotification({
          error,
          category: 'error',
          message: `Failed to add custom JWKS JSON: ${error?.message}`,
        })
      },
    })

  const onAddNewUrl = async (values: { url: string; type: 'openId' | 'jwks' }) => {
    if (!values.url) {
      return
    }

    if (values.type === 'openId') {
      const changeTrackingId = uuidv4()
      const payload = [...(postgrestConfig?.jwt_oidc_issuers ?? []), values.url]
      updateJwt({ projectRef: projectRef!, jwtOidcIssuers: payload, changeTrackingId })
      return
    }
    if (values.type === 'jwks') {
      const changeTrackingId = uuidv4()
      const payload = [...(postgrestConfig?.jwt_jwks_uris ?? []), values.url]
      updateJwt({ projectRef: projectRef!, jwtJwksUris: payload, changeTrackingId })
      return
    }
  }

  return (
    <Modal
      hideFooter
      size="small"
      visible={visible}
      onCancel={() => onClose()}
      header={<h3 className="text-sm">Add a new URL</h3>}
    >
      <Form
        validateOnBlur
        id="new-redirect-url-form"
        initialValues={INITIAL_VALUES}
        validationSchema={newUrlSchema}
        onSubmit={onAddNewUrl}
      >
        {({ values }: any) => {
          return (
            <>
              <div className="mb-4 space-y-4 pt-4">
                <div className="px-5">
                  <p className="text-sm text-scale-1100">
                    This will add a URL to a list of allowed URLs that can interact with your
                    Authentication services for this project.
                  </p>
                </div>
                <div className="px-5">
                  <Radio.Group id="type" name="type" label="Type of the URL">
                    <Radio label="OpenID" value="openId" checked={values.type === 'openId'} />
                    <Radio label="JWKS" value="jwks" checked={values.type === 'jwks'} />
                  </Radio.Group>
                </div>
                <div className="px-5">
                  <Input id="url" name="url" label="URL" placeholder="https://mydomain.com" />
                </div>
                <div className="border-overlay-border border-t" />
                <div className="px-5">
                  <Button
                    block
                    form="new-redirect-url-form"
                    htmlType="submit"
                    size="medium"
                    disabled={isSubmittingJwtSecretUpdateRequest}
                    loading={isSubmittingJwtSecretUpdateRequest}
                  >
                    Add URL
                  </Button>
                </div>
              </div>
            </>
          )
        }}
      </Form>
    </Modal>
  )
}
