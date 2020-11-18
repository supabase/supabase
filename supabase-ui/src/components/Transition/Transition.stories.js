import React from 'react'

import { Transition } from '.'

export default {
  title: 'Utilities/Transition',
  component: Transition,
}

export const Default = (args) => (
  <Transition {...args} className="font-sans">
    <p>I am some text</p>
  </Transition>
)
