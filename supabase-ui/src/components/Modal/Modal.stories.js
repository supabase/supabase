import React from 'react'

import { Modal } from '.'

export default {
  title: 'Overlays/Modal',
  component: Modal
}

export const Default = (args) => 
  <Modal {...args} className="font-sans">
    <p className="text-white">
    Modal content is inserted here
    </p>
  </Modal>

