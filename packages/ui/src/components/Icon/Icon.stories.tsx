import React from 'react'

import { IconMail } from '../Icon/icons/IconMail'
import Typography from '../Typography'
import Icon, { Props } from './Icon'

export default {
  title: 'General/Icon',
  component: IconMail,
}

export const Default = (args: Props) => (
  <div className="block font-sans">
    <div>
      <Typography.Text>
        <IconMail className="dark:text-white text-black" {...args} />
      </Typography.Text>
    </div>
  </div>
)

Default.args = {
  size: 16,
  strokeWidth: 2,
}

const SvgMessagesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
    />
  </svg>
)

export const IconWithSVG = (args: Props) => (
  <Icon className="dark:text-white text-black" {...args} src={<SvgMessagesIcon />} />
)

IconWithSVG.args = {
  size: 'xxxlarge',
  strokeWidth: 4,
}
