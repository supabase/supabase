import { action } from '@storybook/addon-actions'
import React, { useState } from 'react'
import { Button, Space, Typography } from '../../index'

import { SidePanel } from './index'

export default {
  title: 'Overlays/SidePanel',
  component: SidePanel,
}

const content = (
  <span className="text-scale-900 text-sm">
    SidePanel content is inserted here, if you need to insert anything into the
    SidePanel you can do so via
    <span className="text-code">children</span>
  </span>
)

export const Default = (args: any) => (
  <>
    <SidePanel
      {...args}
      header={
        <>
          <h3 className="text-base text-scale-1200">This is the title</h3>
          <p className="text-xs text-scale-900">This is the title</p>
        </>
      }
    >
      {content}
    </SidePanel>
  </>
)

export const withWideLayout = (args: any) => (
  <>
    <SidePanel {...args}>{content}</SidePanel>
  </>
)

export const leftAlignedFooter = (args: any) => (
  <>
    <SidePanel {...args}>{content}</SidePanel>
  </>
)

export const leftAligned = (args: any) => (
  <>
    <SidePanel {...args}>{content}</SidePanel>
  </>
)

export const hideFooter = (args: any) => (
  <>
    <SidePanel {...args}>{content}</SidePanel>
  </>
)

export const customFooter = (args: any) => (
  <>
    <SidePanel {...args}>{content}</SidePanel>
  </>
)

export const triggerElement = (args: any) => (
  <>
    <SidePanel {...args}>
      <span className="text-scale-900">
        This was opened with a trigger element
      </span>
    </SidePanel>
  </>
)

export const nestedSidepanels = (args: any) => {
  const [panel1Visible, setPanel1Visible] = useState(false)
  const [panel2Visible, setPanel2Visible] = useState(false)

  return (
    <>
      <div
        className="
          p-3 px-5 
          bg-scale-300 border border-scale-600 rounded flex gap-4 
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
          <h4 className="text-scale-1200 text-base">
            Shall we nest some components?
          </h4>
          <p className="text-scale-1100 text-sm">yea sure, go on then.</p>
        </div>
        <Button type="secondary" onClick={() => setPanel1Visible(true)}>
          Open sidepanel
        </Button>
      </div>
      <SidePanel
        visible={panel1Visible}
        onCancel={() => setPanel1Visible(false)}
        onConfirm={() => setPanel1Visible(false)}
      >
        <div className="space-y-3">
          <p className="text-sm text-scale-900 font-light">
            This Sidepanel was opened with a trigger element
          </p>

          <p className="text-sm text-scale-1200">
            You can open a nested panel by clicking the button below
          </p>

          <Button type="secondary" onClick={() => setPanel2Visible(true)}>
            Open nested sidepanel
          </Button>
        </div>
        <SidePanel
          visible={panel2Visible}
          onCancel={() => setPanel2Visible(false)}
          onConfirm={() => setPanel2Visible(false)}
        >
          <Button type="secondary" onClick={() => setPanel2Visible(false)}>
            Close nested sidepanel
          </Button>
        </SidePanel>
      </SidePanel>
    </>
  )
}

export const longContent = (args: any) => (
  <>
    <SidePanel {...args}>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
      <p className="text-scale-900">This is a paragraph</p>
    </SidePanel>
  </>
)

Default.args = {
  visible: true,
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the SidePanel',
  description: 'And i am the description',
}

withWideLayout.args = {
  visible: true,
  size: 'large',
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the SidePanel',
  description: 'And i am the description',
}

leftAlignedFooter.args = {
  visible: true,
  alignFooter: 'left',
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the SidePanel',
  description: 'And i am the description',
}

leftAligned.args = {
  visible: true,
  align: 'left',
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the SidePanel',
  description: 'And i am the description',
}

hideFooter.args = {
  visible: true,
  hideFooter: true,
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the SidePanel',
  description: 'And i am the description',
}

customFooter.args = {
  visible: true,
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the SidePanel',
  description: 'And i am the description',
  customFooter: [
    <Space>
      <Button type="secondary">Cancel</Button>
      <Button danger>Delete</Button>
    </Space>,
  ],
}

triggerElement.args = {
  visible: true,
  onCancel: action('onCancel'),
  onConfirm: action('onConfirm'),
  title: 'This is the title of the SidePanel',
  description: 'And i am the description',
  triggerElement: <Button as="span">Open</Button>,
}

longContent.args = {
  visible: true,
  header: 'Long content',
}
