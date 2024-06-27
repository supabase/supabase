import { type ComponentProps } from 'react'
import { IconPanel } from 'ui-patterns'

import HomeMenuIconPicker from '~/components/Navigation/NavigationMenu/HomeMenuIconPicker'

type IconPanelWithIconPickerProps = Omit<ComponentProps<typeof IconPanel>, 'icon'> & {
  icon: string
}

function IconPanelWithIconPicker({ icon, ...props }: IconPanelWithIconPickerProps) {
  return <IconPanel icon={<HomeMenuIconPicker icon={icon} width={18} height={18} />} {...props} />
}

export { IconPanelWithIconPicker }
