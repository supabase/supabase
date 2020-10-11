import React from 'react'

import { Toggle } from '.'

export default {
  title: 'Basic/Toggle',
  component: Toggle,
  argTypes: {
    label: { control: 'text' },
  },
}

export const Primary = (args) => <Toggle {...args} />
Primary.args = {
  label: 'Toggle',
}
