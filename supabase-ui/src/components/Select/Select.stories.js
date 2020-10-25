import React from 'react'

import { Select } from '.'

export default {
  title: 'Form/Select',
  component: Select,
}

export const Default = (args) => (<Select {...args}>
  <option>JavaScript</option>
  <option>TypeScript</option>
  <option>React</option>
</Select>)

Default.args = {
  disabled: false
}
