import React from 'react'
import { Button } from '../Button'
import { IconMail } from '../../index'
import Typography from '../Typography'

import { Tabs } from './'

export default {
  title: 'Displays/Tabs',
  component: Tabs,
}

export const Default = (args: any) => (
  <Tabs defaultActiveId={'panel-1'}>
    <Tabs.Panel id="panel-1" label="1st tab">
      <Typography.Text>Content for the first panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-2" label="2nd tab">
      <Typography.Text>Content for the second panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-3" label="3rd tab">
      <Typography.Text>Content for the third panel</Typography.Text>
    </Tabs.Panel>
  </Tabs>
)

export const Underlined = (args: any) => (
  <Tabs defaultActiveId={'panel-1'} {...args}>
    <Tabs.Panel id="panel-1" label="1st tab">
      <Typography.Text>Content for the first panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-2" label="2nd tab">
      <Typography.Text>Content for the second panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-3" label="3rd tab">
      <Typography.Text>Content for the third panel</Typography.Text>
    </Tabs.Panel>
  </Tabs>
)

export const WithIcons = (args: any) => (
  <Tabs defaultActiveId={'panel-1'} {...args}>
    <Tabs.Panel id="panel-1" label="1st tab" icon={<IconMail />}>
      <Typography.Text>Content for the first panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-2" label="2nd tab" icon={<IconMail />}>
      <Typography.Text>Content for the second panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-3" label="3rd tab" icon={<IconMail />}>
      <Typography.Text>Content for the third panel</Typography.Text>
    </Tabs.Panel>
  </Tabs>
)

export const LargeButtons = (args: any) => (
  <Tabs defaultActiveId={'panel-1'} {...args}>
    <Tabs.Panel id="panel-1" label="1st tab">
      <Typography.Text>Content for the first panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-2" label="2nd tab">
      <Typography.Text>Content for the second panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-3" label="3rd tab">
      <Typography.Text>Content for the third panel</Typography.Text>
    </Tabs.Panel>
  </Tabs>
)

export const BlockTabs = (args: any) => (
  <Tabs defaultActiveId={'panel-1'} {...args}>
    <Tabs.Panel id="panel-1" label="1st tab">
      <Typography.Text>Content for the first panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-2" label="2nd tab">
      <Typography.Text>Content for the second panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-3" label="3rd tab">
      <Typography.Text>Content for the third panel</Typography.Text>
    </Tabs.Panel>
  </Tabs>
)

const limit = 30
let infitniteSroll: JSX.Element[] = []

for (var i = 0; i < limit; i++) {
  infitniteSroll.push(
    <Tabs.Panel id={`panel-${i}`} label={`Tab ${i}`}>
      <Typography.Text>Content for the panel {i}</Typography.Text>
    </Tabs.Panel>
  )
}

export const Scroll = (args: any) => (
  <Tabs defaultActiveId={'panel-1'} {...args}>
    {infitniteSroll}
  </Tabs>
)

export const addOnBefore = (args: any) => (
  <Tabs defaultActiveId={'panel-1'} {...args}>
    <Tabs.Panel id="panel-1" label="1st tab">
      <Typography.Text>Content for the first panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-2" label="2nd tab">
      <Typography.Text>Content for the second panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-3" label="3rd tab">
      <Typography.Text>Content for the third panel</Typography.Text>
    </Tabs.Panel>
  </Tabs>
)

export const addOnAfter = (args: any) => (
  <Tabs defaultActiveId={'panel-1'} {...args}>
    <Tabs.Panel id="panel-1" label="1st tab">
      <Typography.Text>Content for the first panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-2" label="2nd tab">
      <Typography.Text>Content for the second panel</Typography.Text>
    </Tabs.Panel>
    <Tabs.Panel id="panel-3" label="3rd tab">
      <Typography.Text>Content for the third panel</Typography.Text>
    </Tabs.Panel>
  </Tabs>
)

export const OneTab = () => (
  <Tabs defaultActiveId={'panel-1'}>
    <Tabs.Panel id="panel-1" label="1st tab">
      <Typography.Text>Content for the first panel</Typography.Text>
    </Tabs.Panel>
  </Tabs>
)

Default.args = {}
Underlined.args = {
  type: 'underlined',
}
WithIcons.args = {
  type: 'underlined',
}
LargeButtons.args = {
  type: 'underlined',
  size: 'large',
}
BlockTabs.args = {
  type: 'underlined',
  block: true,
}
Scroll.args = {
  type: 'underlined',
  block: true,
  scrollable: true,
}
addOnBefore.args = {
  type: 'underlined',
  size: 'large',
  addOnBefore: <Button type="outline">Left button</Button>,
}
addOnAfter.args = {
  type: 'underlined',
  size: 'large',
  addOnAfter: <Button type="outline">Right button</Button>,
}
