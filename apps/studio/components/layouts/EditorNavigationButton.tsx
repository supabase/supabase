import { SqlEditor } from 'icons'
import { ComponentProps } from 'react'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

export const EditorNavigationButton = ({
  tooltip,
  ...props
}: { tooltip: string } & Omit<ComponentProps<typeof ButtonTooltip>, 'tooltip'>) => (
  <ButtonTooltip
    size="tiny"
    variant="outline"
    className="size-7 shrink-0 px-0"
    icon={<SqlEditor size={14} strokeWidth={1.5} />}
    tooltip={{ content: { side: 'bottom', text: tooltip } }}
    {...props}
  />
)
