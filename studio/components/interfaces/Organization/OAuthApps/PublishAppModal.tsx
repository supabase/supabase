import clsx from 'clsx'
import { ChangeEvent, useEffect, useRef, useState } from 'react'

import { useParams } from 'common'
import { useOAuthAppCreateMutation } from 'data/oauth/oauth-app-create-mutation'
import { useOAuthAppUpdateMutation } from 'data/oauth/oauth-app-update-mutation'
import { OAuthApp } from 'data/oauth/oauth-apps-query'
import { useStore } from 'hooks'
import { isValidHttpUrl, uuidv4 } from 'lib/helpers'
import { Button, Dropdown, Form, IconEdit, IconUpload, Input, Modal } from 'ui'
import { uploadAttachment } from './OAuthApps.utils'

export interface PublishAppModalProps {
  visible: boolean
  selectedApp?: OAuthApp
  onClose: () => void
}

const PublishAppModal = ({ visible, selectedApp, onClose }: PublishAppModalProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const uploadButtonRef = useRef<any>()
  const { mutateAsync: createOAuthApp } = useOAuthAppCreateMutation()
  const { mutateAsync: updateOAuthApp } = useOAuthAppUpdateMutation()

  const [iconFile, setIconFile] = useState<File>()
  const [iconUrl, setIconUrl] = useState<string>()
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [urls, setUrls] = useState<{ id: string; value: string }[]>([{ id: uuidv4(), value: '' }])

  useEffect(() => {
    if (visible) {
      setErrors({})
      setIconFile(undefined)

      if (selectedApp !== undefined) {
        setUrls(
          selectedApp.redirect_uris.map((url) => {
            return { id: uuidv4(), value: url }
          })
        )
        setIconUrl(selectedApp.icon === null ? undefined : selectedApp.icon)
      } else {
        setUrls([{ id: uuidv4(), value: '' }])
        setIconUrl(undefined)
      }
    }
  }, [visible, selectedApp])

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

  const onFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    event.persist()
    const [file] = event.target.files || (event as any).dataTransfer.items
    setIconFile(file)
    setIconUrl(URL.createObjectURL(file))
    event.target.value = ''
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

    const { name, website } = values
    const uploadedIconUrl =
      iconFile !== undefined ? await uploadAttachment(slug, iconFile) : iconUrl

    if (selectedApp === undefined) {
      // Create application
      try {
        await createOAuthApp({ slug, name, website, redirect_uris, icon: uploadedIconUrl })
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
    } else {
      // Update application
      try {
        await updateOAuthApp({
          id: selectedApp.id,
          slug,
          name,
          website,
          redirect_uris,
          icon: uploadedIconUrl === undefined ? null : uploadedIconUrl,
        })
        ui.setNotification({
          category: 'success',
          message: `Successfully updated OAuth app "${name}"!`,
        })
        onClose()
      } catch (error: any) {
        setSubmitting(false)
        ui.setNotification({
          category: 'error',
          message: `Failed to update OAuth app: ${error.message}`,
        })
      }
    }
  }

  return (
    <Modal
      hideFooter
      visible={visible}
      header={
        selectedApp !== undefined ? 'Update OAutha application' : 'Publish a new OAuth application'
      }
      onCancel={() => onClose()}
    >
      <Form
        validateOnBlur
        initialValues={{ name: '', website: '' }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, resetForm }: { isSubmitting: boolean; resetForm: any }) => {
          useEffect(() => {
            if (visible && selectedApp !== undefined) {
              const values = { name: selectedApp.name, website: selectedApp.website }
              resetForm({ values, initialValues: values })
            }
          }, [visible, selectedApp])

          return (
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
                    {iconUrl !== undefined ? (
                      <div
                        className={clsx(
                          'shadow transition group relative',
                          'bg-center bg-cover bg-no-repeat',
                          'mt-4 mr-4 space-y-2 rounded-full h-[120px] w-[120px] flex flex-col items-center justify-center'
                        )}
                        style={{
                          backgroundImage: iconUrl ? `url("${iconUrl}")` : 'none',
                        }}
                      >
                        <div className="absolute bottom-1 right-1">
                          <Dropdown
                            size="tiny"
                            align="end"
                            side="bottom"
                            overlay={[
                              <Dropdown.Item
                                key="upload"
                                onClick={() => {
                                  if (uploadButtonRef.current)
                                    (uploadButtonRef.current as any).click()
                                }}
                              >
                                Upload image
                              </Dropdown.Item>,
                              <Dropdown.Item
                                key="remove"
                                onClick={() => {
                                  setIconFile(undefined)
                                  setIconUrl(undefined)
                                }}
                              >
                                Remove image
                              </Dropdown.Item>,
                            ]}
                          >
                            <Button type="default" icon={<IconEdit />} className="px-1" />
                          </Dropdown>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={clsx(
                          'border border-scale-700 transition opacity-75 hover:opacity-100',
                          'mt-4 mr-4 space-y-2 rounded-full h-[120px] w-[120px] flex flex-col items-center justify-center cursor-pointer'
                        )}
                        onClick={() => {
                          if (uploadButtonRef.current) (uploadButtonRef.current as any).click()
                        }}
                      >
                        <IconUpload size={18} strokeWidth={1.5} className="text-scale-1200" />
                        <p className="text-xs text-scale-1100">Upload logo</p>
                      </div>
                    )}
                    <input
                      multiple
                      type="file"
                      ref={uploadButtonRef}
                      className="hidden"
                      accept="image/png, image/jpeg"
                      onChange={onFileUpload}
                    />
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
          )
        }}
      </Form>
    </Modal>
  )
}

export default PublishAppModal
