import { Fragment } from 'react'
import { CardContent, KeyboardShortcut, Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import type { ShortcutId } from '@/state/shortcuts/registry'
import { setShortcutEnabled } from '@/state/shortcuts/state'
import type { ShortcutDefinition } from '@/state/shortcuts/types'
import { useIsShortcutEnabled } from '@/state/shortcuts/useIsShortcutEnabled'

interface HotkeyToggleProps {
  definition: ShortcutDefinition
  isLast?: boolean
}

export function HotkeyToggle({ definition, isLast }: HotkeyToggleProps) {
  const enabled = useIsShortcutEnabled(definition.id as ShortcutId)

  return (
    <CardContent className={isLast ? undefined : 'border-b'}>
      <FormItemLayout layout="flex-row-reverse" label={definition.label}>
        <div className="flex w-full items-center justify-end gap-x-3">
          <div className="flex items-center gap-1">
            {definition.sequence.map((step, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="text-foreground-lighter text-[11px]">then</span>}
                <KeyboardShortcut keys={hotkeyToKeys(step)} />
              </Fragment>
            ))}
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => setShortcutEnabled(definition.id as ShortcutId, checked)}
          />
        </div>
      </FormItemLayout>
    </CardContent>
  )
}
