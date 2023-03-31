import React from 'react'

import { Toggle } from '.'
import { Button } from '../Button'
import { Input } from '../Input'
import { Space } from '../Space'

export default {
  title: 'Data Input/Toggle',
  component: Toggle,
  argTypes: {
    label: { control: 'text' },
  },
}

export const Primary = (args: any) => <Toggle {...args} />
export const Wide = (args: any) => <Toggle {...args} />
export const checkedDefault = (args: any) => <Toggle {...args} />
export const noLabel = (args: any) => <Toggle {...args} />
export const withBeforeAndAfterLabel = (args: any) => <Toggle {...args} />
export const size = (args: any) => <Toggle {...args} />

Primary.args = {
  descriptionText: 'This is optional description',
  disabled: false,
  error: '',
  label: "Get insights across your organization's repositories",
  labelOptional:
    'Star history, issue tracking, and more to come repository.surf organization',
  name: 'radiogroup-example',
}

Wide.args = {
  descriptionText: 'This is optional description',
  disabled: false,
  error: '',
  label: "Get insights across your organization's repositories",
  labelOptional:
    'Star history, issue tracking, and more to come repository.surf organization',
  name: 'radiogroup-example',
  layout: 'wide',
}

checkedDefault.args = {
  defaultChecked: true,
  descriptionText: 'This is optional description',
  label: 'Radio group main label',
  labelOptional: 'This is an optional label',
}

noLabel.args = {
  active: true,
  disabled: false,
  error: '',
  name: 'radiogroup-example',
  layout: 'horizontal',
}

withBeforeAndAfterLabel.args = {
  label: 'Label',
  beforeLabel: 'Before : ',
  afterLabel: ' : After',
}

size.args = {
  label: 'Try different sizes',
  size: 'tiny',
}
