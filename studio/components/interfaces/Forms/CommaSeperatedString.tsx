import { Button, Form, IconGlobe, IconTrash, Input, Modal } from '@supabase/ui'
import { FormHeader } from 'components/ui/Forms'
import { EmptyListState } from 'components/ui/States'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'

const CommaSeperatedString = () => {
  const { authConfig, ui } = useStore()

  const URI_ALLOW_LIST_ARRAY = authConfig.config.URI_ALLOW_LIST
    ? authConfig.config.URI_ALLOW_LIST.split(',')
    : []

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedDomain, setSelected] = useState('')

  const DomainsForm = () => {
    const [open, setOpen] = useState(false)

    return (
      <>
        <div className="flex items-center justify-between">
          <FormHeader
            title="Redirect URLs"
            description={`URLs that auth providers are permitted to redirect to post authentication`}
          />
          <Button onClick={() => setOpen(true)}>Add domain</Button>
          <Modal
            size="small"
            visible={open}
            onCancel={() => setOpen(!open)}
            header={
              <div className="text-scale-1200 flex items-center gap-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-sm">Add a new domain</h3>
                </div>
              </div>
            }
            contentStyle={{ padding: 0 }}
            hideFooter
          >
            <Form
              id="new-domain-form"
              initialValues={{
                domain: '',
              }}
              validateOnBlur
              onSubmit={async (values: any, { setSubmitting }: any) => {
                setSubmitting(true)
                try {
                  const payload = URI_ALLOW_LIST_ARRAY
                  await payload.push(values.domain)
                  // convert payload to comma seperated string
                  // and update
                  authConfig.update({ URI_ALLOW_LIST: payload.toString() })
                  setSubmitting(false)
                  setOpen(false)
                } catch (error: any) {
                  setSubmitting(false)
                  ui.notification?.error('Failed to update domain: ', error?.message)
                }
              }}
              validate={(values) => {
                const errors: any = {}
                if (!values.domain) {
                  errors.domain = 'A domain is required'
                } else if (
                  !/^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/i.test(
                    values.domain
                  )
                ) {
                  errors.domain = 'Not a valid URL. Please use http:// or https://'
                }
                if (URI_ALLOW_LIST_ARRAY.includes(values.domain)) {
                  errors.domain = 'This domain is already used as a redirect URL'
                }
                return errors
              }}
            >
              {({ isSubmitting }: any) => {
                return (
                  <div className="mb-4 space-y-4 pt-4">
                    <div className="px-5">
                      <p className="text-scale-1100 text-sm">
                        This will add a domain to a list of allowed domains that can interact with
                        your Authenticaton services for this project.
                      </p>
                    </div>
                    <div className="border-overlay-border border-t"></div>
                    <div className="px-5">
                      <Input
                        id="domain"
                        name="domain"
                        label="Domain"
                        placeholder="https://mydomain.com"
                      />
                    </div>
                    <div className="border-overlay-border border-t"></div>
                    <div className="px-5">
                      <Button
                        form="new-domain-form"
                        htmlType="submit"
                        block
                        size="medium"
                        loading={isSubmitting}
                      >
                        Add domain
                      </Button>
                    </div>
                  </div>
                )
              }}
            </Form>
          </Modal>
        </div>
      </>
    )
  }

  console.log('RENDER DOMAINS')

  return (
    <div>
      <DomainsForm />
      <div className="-space-y-px">
        {URI_ALLOW_LIST_ARRAY.length > 0 ? (
          URI_ALLOW_LIST_ARRAY.map((domain: string) => {
            return (
              <>
                <div
                  className="bg-scale-100 dark:bg-scale-300 border-scale-500 text-scale-1200 flex items-center 
              justify-between gap-2
              border px-6 
              py-4 text-sm
            first:rounded-tr first:rounded-tl last:rounded-br last:rounded-bl
            "
                >
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-scale-900">
                      <IconGlobe strokeWidth={2} size={14} />
                    </span>
                    {domain}
                  </div>
                  <Button
                    type="default"
                    icon={<IconTrash />}
                    onClick={() => {
                      setSelected(domain)
                      setDeleteOpen(true)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </>
            )
          })
        ) : (
          <div
            className="
                bg-scale-200 border-scale-400 text-scale-1200 flex items-center 
                justify-center
                gap-2 rounded 
                border 
                px-6 py-8
                text-sm
            "
          >
            <EmptyListState
              title="No Redirect URLs"
              description="Auth providers may need a URL to redirect back to"
            />
          </div>
        )}
      </div>
      <Modal
        size="small"
        visible={deleteOpen}
        onCancel={() => setDeleteOpen(!open)}
        header={
          <div className="text-scale-1200 flex items-center gap-2">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm">Remove domain</h3>
            </div>
          </div>
        }
        contentStyle={{ padding: 0 }}
        hideFooter
      >
        <div className="mb-4 space-y-4 pt-4">
          <div className="px-5">
            <p className="text-scale-1100 mb-2 text-sm">
              Are you sure you want to remove{' '}
              <span className="text-scale-1200">{selectedDomain}</span>?
            </p>
            <p className="text-scale-900 text-sm">
              This domain will no longer work with your Authentication configuration.
            </p>
          </div>
          <div className="border-overlay-border border-t"></div>
          <div className="flex gap-3 px-5">
            <Button
              type="default"
              block
              size="medium"
              onClick={() => {
                // setOpen(!open)
              }}
            >
              Cancel
            </Button>
            <Button
              block
              size="medium"
              type="warning"
              loading={deleteLoading}
              onClick={async () => {
                setDeleteLoading(true)
                try {
                  // remove selectedDomain from array
                  const payload = URI_ALLOW_LIST_ARRAY.filter((e: string) => e !== selectedDomain)
                  // and update
                  await authConfig.update({ URI_ALLOW_LIST: payload.toString() })
                  setDeleteLoading(false)
                  setDeleteOpen(false)
                } catch (error: any) {
                  setDeleteLoading(false)
                  ui.notification?.error('Failed to remove domain: ', error?.message)
                }
              }}
            >
              {deleteLoading ? 'Removing...' : 'Remove domain'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default observer(CommaSeperatedString)
