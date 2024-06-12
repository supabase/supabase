import { type ComponentProps, type PropsWithChildren } from 'react'
import { GlassPanel } from 'ui-patterns/GlassPanel'

import HomeMenuIconPicker from '~/components/Navigation/NavigationMenu/HomeMenuIconPicker'

type GlassPanelWithIconPickerProps = PropsWithChildren<
  Omit<ComponentProps<typeof GlassPanel>, 'icon'> & { icon: string }
>

function GlassPanelWithIconPicker({ children, ...props }: GlassPanelWithIconPickerProps) {
  return (
    <GlassPanel
      {...props}
      icon={<HomeMenuIconPicker icon={props.icon} width={18} height={18} />}
      background={true}
      showIconBg={true}
      showLink={false}
    >
      {children}
    </GlassPanel>
  )
}

export { GlassPanelWithIconPicker }
