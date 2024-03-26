import { actions } from '@storybook/addon-actions'
import React, { useState } from 'react'
import { action } from '@storybook/addon-actions'

import { Modal } from '.'
import Typography from '../Typography'
import { Badge } from '../shadcn/ui/Badge'
import { Form } from '../Form'
import { Button } from '../Button'
import { Space } from '../Space'
import { IconTrash, IconAlertCircle, IconCheck } from './../../index'
import { Dropdown } from '../Dropdown'
import { IconGlobe } from '../Icon/icons/IconGlobe'
import { IconLink2 } from '../Icon/icons/IconLink2'
import { Input } from '../Input'

export default {
  title: 'Overlays/Modal',
  component: Modal,
  argTypes: { onClick: { action: 'clicked' } },
}

export const withUseState = () => {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <div
        className="
          py-4 px-8
          bg-surface-100 
          border 
          border-default 
          rounded flex gap-4 
          shadow-sm
          justify-between
          items-center
          
          fixed
          top-1/2
          left-1/2
          w-3/4

          -translate-x-1/2
          -translate-y-1/2"
      >
        <div>
          <h4 className="text-foreground text-base">Delete your project</h4>
          <p className="text-foreground-light text-sm">It will be sad to see you go</p>
        </div>
        <Button type="default" onClick={() => setVisible(!visible)} icon={<IconTrash />}>
          Delete this project
        </Button>
      </div>
      <div>
        <Modal
          size="small"
          visible={visible}
          onCancel={() => setVisible(!visible)}
          header={
            <div className="flex items-center gap-2 text-foreground">
              {/* <div className="text-border-control">
              <IconTrash strokeWidth={2} />
            </div> */}
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm">Delete your project</h3>
                <span className="text-xs text-foreground-muted">Are you sure?</span>
              </div>
            </div>
          }
          contentStyle={{ padding: 0 }}
          hideFooter
        >
          <Form
            initialValues={{
              name: '',
            }}
            onSubmit={(values: any, { setSubmitting }: any) => {
              setTimeout(() => {
                // alert(JSON.stringify(values, null, 2))
                setSubmitting(false)
                setVisible(false)
              }, 400)
            }}
            validate={(values) => {
              const errors: any = {}
              if (!values.name) {
                errors.name = 'Project name is required'
              } else if (values.name !== 'MyProject') {
                errors.name = 'Does not match project name'
              }
              return errors
            }}
          >
            {({ isSubmitting, errors, touched }: any) => {
              console.log('errors in form', errors)
              console.log('touched in form', touched)
              return (
                <div className="space-y-4 mb-4">
                  <div className="px-5 py-3 bg-amber-100 border-t border-b border-amber-300">
                    <span className="flex gap-3 items-center text-xs text-amber-900">
                      <IconAlertCircle strokeWidth={2} />
                      <span>
                        Once deleted, this project cannot be restored. Please proceed carefully.
                      </span>
                    </span>
                  </div>
                  <div className="px-5">
                    <p className="text-sm text-foreground-light">
                      This action cannot be undone. This will permanently delete the project{' '}
                      <span className="text-foreground font-regular">MyProject</span>.
                    </p>
                  </div>
                  <div className="border-t border-default"></div>
                  <div className="px-5">
                    <Input
                      id="name"
                      size="small"
                      placeholder="Name of your project"
                      label="Please type MyProject to confirm."
                    />
                  </div>
                  <div className="border-t border-default"></div>
                  <div className="px-5">
                    <Button
                      type="danger"
                      htmlType="submit"
                      block
                      size="medium"
                      loading={isSubmitting}
                    >
                      I understand, delete this project
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

export const Default = (args: any) => (
  <Modal
    {...args}
    header={
      <div className="flex items-center gap-2 text-foreground">
        <div className="text-brand-400">
          <IconLink2 />
        </div>
        <div className="flex items-baseline gap-2">
          <h3>This is the title</h3>
          <span className="text-xs text-foreground-muted">This is the title</span>
        </div>
      </div>
    }
  >
    <Typography.Text type="secondary">
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via <Typography.Text code>{'{children}'}</Typography.Text>
    </Typography.Text>
  </Modal>
)

export const withIcon = (args: any) => (
  <Modal {...args}>
    <Typography.Text type="secondary">
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via <Typography.Text code>{'{children}'}</Typography.Text>
    </Typography.Text>
  </Modal>
)

export const withVerticalLayout = (args: any) => (
  <Modal {...args}>
    <Typography.Text type="secondary">
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via <Typography.Text code>{'{children}'}</Typography.Text>
    </Typography.Text>
  </Modal>
)

export const withCloseButton = (args: any) => (
  <Modal {...args}>
    <Typography.Text type="secondary">
      This Modal has a close button on the top right
      <Typography.Text code>{'{children}'}</Typography.Text>
    </Typography.Text>
  </Modal>
)

export const rightAlignedFooter = (args: any) => (
  <Modal {...args}>
    <Typography.Text type="secondary">
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via <Typography.Text code>{'{children}'}</Typography.Text>
    </Typography.Text>
  </Modal>
)

export const hideFooter = (args: any) => (
  <Modal {...args}>
    <Typography.Text type="secondary">
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via <Typography.Text code>{'{children}'}</Typography.Text>
    </Typography.Text>
  </Modal>
)

export const withFooterBackground = (args: any) => (
  <Modal {...args}>
    <Typography.Text type="secondary">
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via <Typography.Text code>{'{children}'}</Typography.Text>
    </Typography.Text>
  </Modal>
)

export const customFooter = (args: any) => (
  <Modal {...args}>
    <Typography.Text type="secondary">
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via <Typography.Text code>{'{children}'}</Typography.Text>
    </Typography.Text>
  </Modal>
)

export const customFooterVertical = (args: any) => (
  <Modal {...args}>
    <Typography.Text type="secondary">
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via <Typography.Text code>{'{children}'}</Typography.Text>
    </Typography.Text>
  </Modal>
)

export const LongModal = () => (
  <div>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <p>
      Modal content is inserted here, if you need to insert anything into the Modal you can do so
      via
    </p>
    <Modal visible={true}>
      <Typography.Text type="secondary">
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <p>
          Modal content is inserted here, if you need to insert anything into the Modal you can do
          so via
        </p>
        <Typography.Text code>{'{children}'}</Typography.Text>
      </Typography.Text>
    </Modal>
  </div>
)

export const customFooterOneButton = (args: any) => <Modal {...args} />

export const modalWithDropdowns = () => {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <Button onClick={() => setVisible(!visible)}>Open</Button>
      <Modal
        visible={visible}
        onCancel={() => setVisible(!visible)}
        hideFooter
        // className="pointer-events-auto"
      >
        <Dropdown
          // className="pointer-events-auto"
          overlay={
            <>
              <Dropdown.Item onClick={() => console.log('item 1 clicked')}>Item 1</Dropdown.Item>
              <Dropdown.Item onClick={() => console.log('item 2 clicked')}>Item 2</Dropdown.Item>
            </>
          }
        >
          <Button asChild>
            <span>Trigger dropdown</span>
          </Button>
        </Dropdown>
      </Modal>
    </>
  )
}

Default.args = {
  visible: true,
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the modal',
  description: 'And i am the description',
  size: 'medium',
}

withFooterBackground.args = {
  visible: true,
  footerBackground: true,
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the modal',
  description: 'And i am the description',
}

const icon = <IconAlertCircle background="brand" size="xlarge" />

withIcon.args = {
  visible: true,
  showIcon: true,
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the modal',
  description: 'And i am the description',
  icon: icon,
}

withCloseButton.args = {
  visible: true,
  closable: true,
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This Modal has a close button on the top right',
  description: 'And i am the description',
}

withVerticalLayout.args = {
  visible: true,
  size: 'small',
  layout: 'vertical',
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the modal',
  description: 'And i am the description',
  icon: icon,
}

rightAlignedFooter.args = {
  visible: true,
  alignFooter: 'right',
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the modal',
  description: 'And i am the description',
}

hideFooter.args = {
  visible: true,
  hideFooter: true,
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the modal',
  description: 'And i am the description',
}

customFooter.args = {
  visible: true,
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the modal',
  description: 'And i am the description',
  customFooter: [
    <Space>
      <div>
        <Badge variant="destructive" dot size="small">
          Proceed with caution
        </Badge>
      </div>
      <Button type="secondary">Cancel</Button>
      <Button danger>Delete</Button>
    </Space>,
  ],
}

customFooterVertical.args = {
  visible: true,
  size: 'small',
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the modal',
  description: 'And i am the description',
  layout: 'vertical',
  customFooter: [
    <Space style={{ width: '100%' }}>
      <Button size="medium" block type="secondary">
        Cancel
      </Button>
      <Button size="medium" block danger icon={<IconTrash />}>
        Delete
      </Button>
    </Space>,
  ],
}

customFooterOneButton.args = {
  visible: true,
  size: 'small',
  icon: <IconCheck background="brand" size="xxxlarge" />,
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'Payment successful',
  description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.',
  layout: 'vertical',
  customFooter: [
    <Space style={{ width: '100%' }}>
      <Button size="medium" block icon={<IconCheck />}>
        Confirm
      </Button>
    </Space>,
  ],
}
