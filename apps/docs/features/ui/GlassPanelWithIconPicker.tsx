import { type ComponentProps, type PropsWithChildren } from 'react'
import { GlassPanel } from 'ui-patterns/GlassPanel'

import HomeMenuIconPicker from '~/components/Navigation/NavigationMenu/HomeMenuIconPicker'

type GlassPanelWithIconPickerProps = PropsWithChildren<
  Omit<ComponentProps<typeof GlassPanel>, 'icon'> & { icon: string }
>

function GlassPanelWithIconPicker({ children, icon, ...props }: GlassPanelWithIconPickerProps) {
  return (
    <GlassPanel icon={<HomeMenuIconPicker icon={icon} width={18} height={18} />} {...props}>
      {children}
    </GlassPanel>
  )
}

export { GlassPanelWithIconPicker }
