import { useEffect, useState } from 'react'

import { useOAuthAppCreateMutation } from 'data/oauth/oauth-app-create-mutation'
import { isValidHttpUrl, uuidv4 } from 'lib/helpers'
import { Button, Form, IconUpload, Input, Modal } from 'ui'
import clsx from 'clsx'
import { useStore } from 'hooks'
import { useParams } from 'common'

// [Joshen TODO] Support uploading of icon

export interface PublishAppModalProps {
  visible: boolean
  onClose: () => void
}

const PublishAppModal = ({ visible, onClose }: PublishAppModalProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const { mutateAsync: createOAuthApp } = useOAuthAppCreateMutation()
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [urls, setUrls] = useState<{ id: string; value: string }[]>([{ id: uuidv4(), value: '' }])

  useEffect(() => {
    if (visible) {
      // Reset field
      setUrls([{ id: uuidv4(), value: '' }])
      setErrors({})
    }
  }, [visible])

  const onUpdateUrl = (id: string, value: string) => {
    const updatedUrls = urls.map((url) => {
      if (url.id === id) return { id, value }
      else return url
    })
    setUrls(updatedUrls)
    setErrors({})
  }

  const removeUrl = (id: string) => {
    const updatedUrls = urls.filter((url) => url.id !== id)
    setUrls(updatedUrls)
  }

  const validate = (values: any) => {
    const errors: any = {}
    if (!values.name) errors.name = 'Please provide a name for your application'
    if (!values.website) errors.website = 'Please provide a URL for your site'
    if (!isValidHttpUrl(values.website)) errors.website = 'Please provide a valid URL for your site'
    return errors
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    if (!slug) return console.error('Slug is required')

    const redirect_uris = urls.filter((url) => url.value.length > 0).map((url) => url.value)
    if (redirect_uris.length === 0) {
      setSubmitting(false)
      setErrors({ urls: 'Please provide at least one URL' })
      return
    } else {
      setErrors({})
    }

    try {
      const { name, website } = values
      const res = await createOAuthApp({ slug, name, website, redirect_uris })
      console.log({ res })
      ui.setNotification({
        category: 'success',
        message: `Successfully created OAuth app "${name}"!`,
      })
      onClose()
    } catch (error: any) {
      setSubmitting(false)
      ui.setNotification({
        category: 'error',
        message: `Failed to create OAuth app: ${error.message}`,
      })
    }
  }

  return (
    <Modal
      hideFooter
      visible={visible}
      header="Publish a new OAuth application"
      onCancel={() => onClose()}
    >
      <Form
        validateOnBlur
        initialValues={{ name: '', website: '' }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ isSubmitting }: { isSubmitting: boolean }) => (
          <div>
            <Modal.Content>
              <div className="py-4 flex items-start justify-between gap-10">
                <div className="space-y-4 w-full">
                  <Input id="name" label="Application name"></Input>
                  <Input
                    id="website"
                    label="Website URL"
                    placeholder="https://my-website.com"
                  ></Input>
                </div>
                <div>
                  <div
                    className={clsx(
                      'border border-scale-700 transition opacity-75 hover:opacity-100',
                      'mt-4 mr-4 space-y-2 rounded-full h-[120px] w-[120px] flex flex-col items-center justify-center cursor-pointer'
                    )}
                  >
                    <IconUpload size={18} strokeWidth={1.5} className="text-scale-1200" />
                    <p className="text-xs text-scale-1100">Upload logo</p>
                  </div>
                </div>
              </div>
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="prose text-sm">Allowed URLs</p>
                  <p className="text-sm text-scale-1000">
                    All URLs must use HTTPS, except for localhost
                  </p>
                </div>
                <Button onClick={() => setUrls(urls.concat({ id: uuidv4(), value: '' }))}>
                  Add URL
                </Button>
              </div>
              <div className="space-y-2 pb-2">
                {urls.map((url) => (
                  <Input
                    key={url.id}
                    value={url.value}
                    onChange={(event) => onUpdateUrl(url.id, event.target.value)}
                    placeholder="e.g https://my-website.com"
                    actions={[
                      urls.length > 1 ? (
                        <Button key="remove-url" type="default" onClick={() => removeUrl(url.id)}>
                          Remove
                        </Button>
                      ) : null,
                    ]}
                  />
                ))}
                {errors.urls && <p className="text-red-900 text-sm">{errors.urls}</p>}
              </div>
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content>
              <div className="pt-2 pb-3 flex items-center space-x-2 justify-end">
                <Button type="default" disabled={isSubmitting} onClick={() => onClose()}>
                  Cancel
                </Button>
                <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                  Confirm
                </Button>
              </div>
            </Modal.Content>
          </div>
        )}
      </Form>
    </Modal>
  )
}

export default PublishAppModal
