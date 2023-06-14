import React from 'react'
import Typography from '../Typography'

import { Card } from './'
import { CardProps } from './Card'

export default {
  title: 'Displays/Card',
  component: Card,
}

export const Default = (args: CardProps) => (
  <Card {...args}>
    <Typography.Title level={5}>Card content</Typography.Title>
    <Typography.Title level={5}>Card content</Typography.Title>
    <Typography.Title level={5}>Card content</Typography.Title>
  </Card>
)

export const withCover = (args: CardProps) => (
  <Card {...args}>
    <Typography.Text type="secondary">Sub title here</Typography.Text>
    <Typography.Title level={3}>To Do List with Vue.JS</Typography.Title>
  </Card>
)

export const withMeta = (args: CardProps) => (
  <Card {...args}>
    <Card.Meta title={'To Do List with Vue.JS'} description={'To Do List with Vue.JS'}/>
  </Card>
)

export const withHover = (args: CardProps) => (
  <Card {...args}>
    <Card.Meta title={'To Do List with Vue.JS'} description={'To Do List with Vue.JS'}/>
  </Card>
)

Default.args = {
  title: 'I am a title',
  titleExtra: <Typography.Link>Learn more</Typography.Link>,
}

withCover.args = {
  cover: (
    <img
      className="h-64 w-full object-cover"
      src={'https://supabase.com/images/og/og-image.jpg'}
      alt={'title'}
    />
  ),
}

withMeta.args = {
  title: 'title is here'
}

withHover.args = {
  title: 'This card can hover',
  hoverable: true
}
