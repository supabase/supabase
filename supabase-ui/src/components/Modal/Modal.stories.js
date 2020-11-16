import React from 'react'

import { Modal } from '.'

export default {
  title: 'Overlays/Modal',
  component: Modal
}

export const Default = (args) => <Modal {...args}>Modal content is inserted here</Modal>
