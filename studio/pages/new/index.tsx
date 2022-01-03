import Router from 'next/router'
import { observer } from 'mobx-react-lite'

import { useStore, withAuth } from 'hooks'
import { API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'

import { Button, Form, Input, Typography } from '@supabase/ui'

import { WizardLayout } from 'components/layouts'
import Panel from 'components/to-be-cleaned/Panel'

const { Text, Title } = Typography

/**
 * No org selected yet, create a new one
 */
const Wizard = () => {
  const { ui, app } = useStore()

  return (
    <WizardLayout organization={null} project={null}>
      <Form
        initialValues={{
          organization_name: '',
        }}
        validate={(values) => {
          const errors: any = {}

          if (values.organization_name.length < 3) {
            errors.organization_name = 'Organization name needs to be at least 3 characters long'
          }
          function validateOrgName(name: any) {
            const value = name ? name.trim() : ''
            return value.length >= 1
          }
          const isOrgNameValid = validateOrgName(values.organization_name)
          if (!isOrgNameValid) {
            errors.organization_name = 'You need to enter a name'
          }

          return errors
        }}
        validateOnBlur
        onSubmit={async (values: any, { setSubmitting }: any) => {
          const response = await post(`${API_URL}/organizations/new`, {
            name: values.organization_name,
          })
          if (response.error) {
            setSubmitting(false)
            ui.setNotification({
              category: 'error',
              message: `Failed to create organization: ${
                response.error?.message ?? response.error
              }`,
            })
          } else {
            setSubmitting(false)
            const org = response
            app.onOrgAdded(org)
            Router.push('/new/[slug]', `/new/${org.slug}`)
          }
        }}
      >
        {({ isSubmitting }: any) => (
          <Panel
            hideHeaderStyling
            title={<Title level={4}>Create a new organization</Title>}
            footer={
              <div className="flex items-center w-full justify-between">
                <Button type="default" onClick={() => Router.push('/')}>
                  Cancel
                </Button>
                <div className="space-x-3">
                  <Text type="secondary" small>
                    You can rename your organization later
                  </Text>
                  <Button loading={isSubmitting} htmlType="submit">
                    Create organization
                  </Button>
                </div>
              </div>
            }
          >
            <Panel.Content className="pt-0">
              <Text>
                This is your organization's name within Supabase.
                <br />
              </Text>
              <Text type="secondary">
                For example, you can use the name of your company or department
              </Text>
            </Panel.Content>
            <Panel.Content>
              <Input
                id="organization_name"
                layout="horizontal"
                label="Name"
                type="text"
                placeholder="Organization name"
                descriptionText="What's the name of your company or team?"
                autoFocus
              />
            </Panel.Content>
          </Panel>
        )}
      </Form>
    </WizardLayout>
  )
}

export default withAuth(observer(Wizard))
