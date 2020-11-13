import React from 'react'

import { Input } from '.'

export default {
  title: 'Form/Input',
  component: Input,
}

export const Default = (args) => <Input {...args} />
Default.args = {
  placeholder: 'Type text here ...',
  disabled: false
}
