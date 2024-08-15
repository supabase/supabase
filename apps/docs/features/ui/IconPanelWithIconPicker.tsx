import { type ComponentProps } from 'react'
import { IconPanel } from 'ui-patterns'

import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'

type IconPanelWithIconPickerProps = Omit<ComponentProps<typeof IconPanel>, 'icon'> & {
  icon: string
}

function IconPanelWithIconPicker({ icon, ...props }: IconPanelWithIconPickerProps) {
  return <IconPanel icon={<MenuIconPicker icon={icon} width={18} height={18} />} {...props} />
}

export { IconPanelWithIconPicker }
