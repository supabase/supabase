import React from 'react'

import { SideOver } from '.'

export default {
  title: 'Overlays/SideOver',
  component: SideOver
}

export const Default = (args) => 
<div className='font-sans'>
<SideOver {...args}>Modal content is inserted here</SideOver>
</div>
