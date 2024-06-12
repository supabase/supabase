import { type ComponentProps } from 'react'
import { IconPanel } from 'ui-patterns'

import HomeMenuIconPicker from '~/components/Navigation/NavigationMenu/HomeMenuIconPicker'

type IconPanelWithIconPickerProps = Omit<ComponentProps<typeof IconPanel>, 'icon'> & {
  icon: string
}

function IconPanelWithIconPicker(props: IconPanelWithIconPickerProps) {
  return (
    <IconPanel
      {...props}
      icon={<HomeMenuIconPicker icon={props.icon} width={18} height={18} />}
      background={true}
      showLink={false}
    />
  )
}

export { IconPanelWithIconPicker }
