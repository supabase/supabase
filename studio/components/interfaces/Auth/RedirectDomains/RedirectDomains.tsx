import { useState } from 'react'
import { object, string } from 'yup'
import { observer } from 'mobx-react-lite'
import { Button, Form, Input, Modal } from '@supabase/ui'

import { useStore } from 'hooks'
import { FormHeader } from 'components/ui/Forms'
import { domainRegex } from '../Auth.constants'
import DomainList from './DomainList'

const RedirectDomains = () => {
  const { authConfig, ui } = useStore()

  const URI_ALLOW_LIST_ARRAY = authConfig.config.URI_ALLOW_LIST
    ? authConfig.config.URI_ALLOW_LIST.split(',')
    : []

  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedDomainToDelete, setSelectedDomainToDelete] = useState<string>()

  const newDomainSchema = object({
    domain: string().matches(domainRegex, 'URL is not valid').required(),
  })

  const onAddNewDomain = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)
    try {
      const payload = URI_ALLOW_LIST_ARRAY
      await payload.push(values.domain)
      // convert payload to comma seperated string and update
      authConfig.update({ URI_ALLOW_LIST: payload.toString() })
      setSubmitting(false)
      setOpen(false)
      ui.setNotification({ category: 'success', message: 'Successfully added domain' })
    } catch (error: any) {
      setSubmitting(false)
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to update domain: ${error?.message}`,
      })
    }
  }

  const onConfirmDeleteDomain = async (domain?: string) => {
    if (!domain) return

    setIsDeleting(true)
    try {
      // Remove selectedDomain from array and update
      const payload = URI_ALLOW_LIST_ARRAY.filter((e: string) => e !== domain)
      await authConfig.update({ URI_ALLOW_LIST: payload.toString() })
      setIsDeleting(false)
      setSelectedDomainToDelete(undefined)
      ui.setNotification({ category: 'success', message: 'Successfully removed domain' })
    } catch (error: any) {
      setIsDeleting(false)
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to remove domain: ${error?.message}`,
      })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <FormHeader
          title="Redirect URLs"
          description="URLs that auth providers are permitted to redirect to post authentication"
        />
        <Button onClick={() => setOpen(true)}>Add domain</Button>
      </div>
      <DomainList onSelectDomainToDelete={setSelectedDomainToDelete} />
      <Modal
        hideFooter
        size="small"
        visible={open}
        onCancel={() => setOpen(!open)}
        header={<h3 className="text-sm">Add a new domain</h3>}
      >
        <Form
          validateOnBlur
          id="new-domain-form"
          initialValues={{ domain: '' }}
          validationSchema={newDomainSchema}
          onSubmit={onAddNewDomain}
        >
          {({ isSubmitting }: { isSubmitting: boolean }) => {
            return (
              <div className="mb-4 space-y-4 pt-4">
                <div className="px-5">
                  <p className="text-scale-1100 text-sm">
                    This will add a domain to a list of allowed domains that can interact with your
                    Authenticaton services for this project.
                  </p>
                </div>
                <div className="border-overlay-border border-t" />
                <div className="px-5">
                  <Input
                    id="domain"
                    name="domain"
                    label="Domain"
                    placeholder="https://mydomain.com"
                  />
                </div>
                <div className="border-overlay-border border-t" />
                <div className="px-5">
                  <Button
                    block
                    form="new-domain-form"
                    htmlType="submit"
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
      <Modal
        hideFooter
        size="small"
        visible={selectedDomainToDelete !== undefined}
        header={<h3 className="text-sm">Remove domain</h3>}
        onCancel={() => setSelectedDomainToDelete(undefined)}
      >
        <div className="mb-4 space-y-4 pt-4">
          <div className="px-5">
            <p className="text-scale-1100 mb-2 text-sm">
              Are you sure you want to remove{' '}
              <span className="text-scale-1200">{selectedDomainToDelete}</span>?
            </p>
            <p className="text-scale-1100 text-sm">
              This domain will no longer work with your authentication configuration.
            </p>
          </div>
          <div className="border-overlay-border border-t"></div>
          <div className="flex gap-3 px-5">
            <Button
              block
              type="default"
              size="medium"
              onClick={() => setSelectedDomainToDelete(undefined)}
            >
              Cancel
            </Button>
            <Button
              block
              size="medium"
              type="warning"
              loading={isDeleting}
              onClick={() => onConfirmDeleteDomain(selectedDomainToDelete)}
            >
              {isDeleting ? 'Removing...' : 'Remove domain'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default observer(RedirectDomains)
