import React from 'react'

import { Input } from '.'

export default {
  title: 'Basic/Input',
  component: Input,
}

export const Default = (args) => <Input {...args} />
Default.args = {
  placeholder: 'Type text here ...',
}
