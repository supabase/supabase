import { actions } from '@storybook/addon-actions'
import React from 'react'
import { action } from '@storybook/addon-actions'

import { Modal } from '.'

export default {
  title: 'Overlays/Modal',
  component: Modal,
  argTypes: { onClick: { action: 'clicked' } },
}

export const Default = (args) => 
  <Modal {...args} 
    className="font-sans"
    onCancel={action('onCancel')}
    onConfirm={action('onConfirm')}
    >
    <p className="text-white">
    Modal content is inserted here
    </p>
  </Modal>

