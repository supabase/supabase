import React from 'react'

import { SideOver } from '.'

export default {
  title: 'Overlays/SideOver',
  component: SideOver,
}

export const Default = (args) => (
  <div className="font-sans">
    <SideOver {...args}>
      <p className="text-white">SideOver content is inserted here</p>
    </SideOver>
  </div>
)
