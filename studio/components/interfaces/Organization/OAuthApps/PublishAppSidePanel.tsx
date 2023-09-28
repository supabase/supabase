import clsx from 'clsx'
import { ChangeEvent, useEffect, useRef, useState } from 'react'

import { useParams } from 'common'
import {
  OAuthAppCreateResponse,
  useOAuthAppCreateMutation,
} from 'data/oauth/oauth-app-create-mutation'
import { useOAuthAppUpdateMutation } from 'data/oauth/oauth-app-update-mutation'
import { OAuthApp } from 'data/oauth/oauth-apps-query'
import { useStore } from 'hooks'
import { isValidHttpUrl, uuidv4 } from 'lib/helpers'
import { Badge, Button, Dropdown, Form, IconEdit, IconUpload, Input, Modal, SidePanel } from 'ui'
import { uploadAttachment } from 'lib/upload'
import AuthorizeRequesterDetails from './AuthorizeRequesterDetails'

export interface PublishAppSidePanelProps {
  visible: boolean
  selectedApp?: OAuthApp
  onClose: () => void
  onCreateSuccess: (app: OAuthAppCreateResponse) => void
}

const PublishAppSidePanel = ({
  visible,
  selectedApp,
  onClose,
  onCreateSuccess,
}: PublishAppSidePanelProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const uploadButtonRef = useRef<any>()
  const { mutate: createOAuthApp } = useOAuthAppCreateMutation({
    onSuccess: (res, variables) => {
      ui.setNotification({
        category: 'success',
        message: `Successfully created OAuth app "${variables.name}"!`,
      })
      onClose()
      onCreateSuccess(res)
      setIsSubmitting(false)
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to create OAuth application: ${error.message}`,
      })
      setIsSubmitting(false)
    },
  })
  const { mutate: updateOAuthApp } = useOAuthAppUpdateMutation({
    onSuccess: (res, variables) => {
      ui.setNotification({
        category: 'success',
        message: `Successfully updated OAuth app "${variables.name}"!`,
      })
      onClose()
      setIsSubmitting(false)
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to update OAuth application: ${error.message}`,
      })
      setIsSubmitting(false)
    },
  })

  // [Joshen] Separate submitting state as there are additional async logic involved in the creation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [iconFile, setIconFile] = useState<File>()
  const [iconUrl, setIconUrl] = useState<string>()
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [urls, setUrls] = useState<{ id: string; value: string }[]>([{ id: uuidv4(), value: '' }])

  useEffect(() => {
    if (visible) {
      setErrors({})
      setIsSubmitting(false)
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

  const onSubmit = async (values: any) => {
    if (!slug) return console.error('Slug is required')

    const redirect_uris = urls.filter((url) => url.value.length > 0).map((url) => url.value)
    if (redirect_uris.length === 0) {
      setErrors({ urls: 'Please provide at least one URL' })
      return
    } else {
      setErrors({})
    }

    setIsSubmitting(true)
    const { name, website } = values
    const uploadedIconUrl =
      iconFile !== undefined
        ? await uploadAttachment('oauth-app-icons', `${slug}/${uuidv4()}.png`, iconFile)
        : iconUrl

    if (selectedApp === undefined) {
      // Create application
      createOAuthApp({
        slug,
        name,
        website,
        redirect_uris,
        icon: uploadedIconUrl,
      })
    } else {
      // Update application
      updateOAuthApp({
        id: selectedApp.id,
        slug,
        name,
        website,
        redirect_uris,
        icon: uploadedIconUrl === undefined ? null : uploadedIconUrl,
      })
    }
  }

  return (
    <>
      <SidePanel
        hideFooter
        size="large"
        visible={visible}
        header={
          selectedApp !== undefined ? 'Update OAuth application' : 'Publish a new OAuth application'
        }
        onCancel={() => onClose()}
      >
        <Form
          validateOnBlur
          className="h-full"
          initialValues={{ name: '', website: '' }}
          validate={validate}
          onSubmit={onSubmit}
        >
          {({ resetForm, values }: { resetForm: any; values: any }) => {
            // [Joshen] although this "technically" is breaking the rules of React hooks
            // it won't error because the hooks are always rendered in the same order
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useEffect(() => {
              if (visible && selectedApp !== undefined) {
                const values = { name: selectedApp.name, website: selectedApp.website }
                resetForm({ values, initialValues: values })
              }
              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [visible, selectedApp])

            return (
              <>
                <div className="h-full flex flex-col">
                  <div className="flex-grow">
                    <SidePanel.Content>
                      <div className="py-4 flex items-start justify-between gap-10">
                        <div className="space-y-4 w-full">
                          <Input
                            id="name"
                            label="Application name"
                            descriptionText={selectedApp?.id && `ID: ${selectedApp.id}`}
                          />
                          <Input
                            id="website"
                            label="Website URL"
                            placeholder="https://my-website.com"
                          />
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
                                if (uploadButtonRef.current)
                                  (uploadButtonRef.current as any).click()
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
                    </SidePanel.Content>

                    <SidePanel.Separator />

                    <SidePanel.Content className="py-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="prose text-sm">Authorization callback URLs</p>
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
                                <Button
                                  key="remove-url"
                                  type="default"
                                  onClick={() => removeUrl(url.id)}
                                >
                                  Remove
                                </Button>
                              ) : null,
                            ]}
                          />
                        ))}
                        {errors.urls && <p className="text-red-900 text-sm">{errors.urls}</p>}
                      </div>
                    </SidePanel.Content>
                    <SidePanel.Separator />
                  </div>

                  <SidePanel.Separator />

                  <SidePanel.Content>
                    <div className="pt-2 pb-3 flex items-center justify-between">
                      <Button
                        type="default"
                        onClick={() => setShowPreview(true)}
                        disabled={values.name.length === 0 || values.website.length === 0}
                      >
                        Preview consent for users
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Button type="default" disabled={isSubmitting} onClick={() => onClose()}>
                          Cancel
                        </Button>
                        <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                          Confirm
                        </Button>
                      </div>
                    </div>
                  </SidePanel.Content>
                </div>

                <Modal
                  hideFooter
                  className="!w-[500px]"
                  visible={showPreview}
                  onCancel={() => setShowPreview(false)}
                >
                  <Modal.Content>
                    <div className="pt-4 pb-2 px-2 flex items-center justify-between">
                      <p>Authorize API access for {values.name}</p>
                      <Badge color="green">Preview</Badge>
                    </div>
                  </Modal.Content>
                  <Modal.Separator />
                  <Modal.Content>
                    <div className="px-2 py-4">
                      <AuthorizeRequesterDetails
                        icon={iconUrl || null}
                        name={values.name}
                        domain={values.website}
                      />
                      <div className="pt-4 space-y-2">
                        <p className="prose text-sm">
                          Select an organization to grant API access to
                        </p>
                        <div className="border border-scale-600 text-scale-1000 rounded px-4 py-2 text-sm bg-scale-400">
                          Organizations that you have access to will be listed here
                        </div>
                      </div>
                    </div>
                  </Modal.Content>
                  <Modal.Separator />
                  <Modal.Content>
                    <div className="pt-2 pb-3 flex items-center justify-between">
                      <p className="prose text-xs">
                        This is what your users will see when authorizing with your app
                      </p>
                      <Button type="default" onClick={() => setShowPreview(false)}>
                        Close
                      </Button>
                    </div>
                  </Modal.Content>
                </Modal>
              </>
            )
          }}
        </Form>
      </SidePanel>
    </>
  )
}

export default PublishAppSidePanel
