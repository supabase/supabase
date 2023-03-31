import React from 'react'

import { Radio } from '.'

export default {
  title: 'Archive/Radio',
  component: Radio,
}

export const Default = (args) => (
  <div className="block font-sans">
    <div>
      <Radio name="radio-group" label="JavaScript" {...args} /> 
    </div>
    <div>
      <Radio name="radio-group" label="TypeScript" {...args} />
    </div>
    <div>
      <Radio name="radio-group" label="ReScript" {...args} />
    </div>
  </div>
)

Default.args = {
  disabled: false,
}
