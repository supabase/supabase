import React from 'react'
import { Breadcrumb } from './../../../'

export default {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
}

export const Default = ({ children, ...args }: any) => <Breadcrumb {...args}>{children}</Breadcrumb>

Default.args = {
  children: [
    <Breadcrumb.Item>Brothers</Breadcrumb.Item>,
    <Breadcrumb.Item>Grimm</Breadcrumb.Item>,
    <Breadcrumb.Item active>Hansel</Breadcrumb.Item>,
    <Breadcrumb.Item>Gretel</Breadcrumb.Item>,
  ],
}
