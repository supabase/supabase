import React from 'react'

import { Checkbox } from '.'

export default {
  title: 'Form/Checkbox',
  component: Checkbox,
}

export const Default = (args) => (
  <div className="block font-sans">
    <div>
      <Checkbox name="checkbox-group" label="JavaScript" {...args} /> 
    </div>
    <div>
      <Checkbox name="checkbox-group" label="TypeScript" {...args} />
    </div>
    <div>
      <Checkbox name="checkbox-group" label="ReScript" {...args} />
    </div>
  </div>
)

Default.args = {
  disabled: false,
}
