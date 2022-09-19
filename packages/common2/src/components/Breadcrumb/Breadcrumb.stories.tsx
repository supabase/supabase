import React from 'react'
import { Breadcrumb } from '../Breadcrumb'
import { Textarea } from '../Textarea'
import Typography from '../Typography'

export default {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
}

export const Default = ({ children, ...args }) => (
  <Breadcrumb {...args}>{children}</Breadcrumb>
)

Default.args = {
  children: [
    <Breadcrumb.Item>Brothers</Breadcrumb.Item>,
    <Breadcrumb.Item>Grimm</Breadcrumb.Item>,
    <Breadcrumb.Item active>Hansel</Breadcrumb.Item>,
    <Breadcrumb.Item>Gretel</Breadcrumb.Item>,
  ],
}
