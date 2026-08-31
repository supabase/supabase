import { LoaderCircle, RefreshCcw } from 'lucide-react'
import { Button } from 'ui'

import { ButtonTooltip } from '../ButtonTooltip'
import { Shortcut } from '@/components/ui/Shortcut'
import type { ShortcutId } from '@/state/shortcuts/registry'

interface RefreshButtonProps {
  isLoading: boolean
  onRefresh: () => void
  /**
   * When provided, the button binds this registered shortcut (hotkey + a
   * tooltip that surfaces the keybind). Otherwise it falls back to a plain
   * "Refresh logs" tooltip with no keybind.
   */
  shortcutId?: ShortcutId
}

export const RefreshButton = ({ isLoading, onRefresh, shortcutId }: RefreshButtonProps) => {
  const icon = isLoading ? (
    <LoaderCircle className="text-foreground animate-spin" />
  ) : (
    <RefreshCcw className="text-foreground" />
  )

  if (shortcutId) {
    return (
      <Shortcut
        id={shortcutId}
        onTrigger={onRefresh}
        options={{ enabled: !isLoading, registerInCommandMenu: true }}
        side="bottom"
      >
        <Button
          size="tiny"
          variant="default"
          disabled={isLoading}
          onClick={onRefresh}
          className="w-[26px]"
          icon={icon}
          aria-label="Refresh logs"
        />
      </Shortcut>
    )
  }

  return (
    <ButtonTooltip
      size="tiny"
      variant="default"
      disabled={isLoading}
      onClick={onRefresh}
      className="w-[26px]"
      icon={icon}
      tooltip={{ content: { side: 'bottom', text: 'Refresh logs' } }}
    />
  )
}
