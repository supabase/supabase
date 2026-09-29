import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger } from 'ui'

import type { PermissionSelection } from '../../AccessToken.permissions'
import {
  getActivePreset,
  PERMISSION_PRESETS,
  type PermissionPreset,
} from '../../AccessToken.presets'

interface PermissionPresetSelectProps {
  selection: PermissionSelection
  onApplyPreset: (preset: PermissionPreset) => void
}

export const PermissionPresetSelect = ({
  selection,
  onApplyPreset,
}: PermissionPresetSelectProps) => {
  const [announcement, setAnnouncement] = useState('')
  const activePreset = getActivePreset(selection)

  const handleSelectPreset = (id: string) => {
    const preset = PERMISSION_PRESETS.find((candidate) => candidate.id === id)
    if (preset === undefined) return
    onApplyPreset(preset)
    setAnnouncement(preset.announcement)
  }

  return (
    // A div root so FormLayout's flex-row-reverse column stretches the trigger to its full width,
    // lining it up with the resource selects in the section above.
    <div>
      {/* An empty value leaves every option unchecked, which is how "Custom" reads: a state the
          selection can land in, never one you can pick. */}
      <Select value={activePreset?.id ?? ''} onValueChange={handleSelectPreset}>
        <SelectTrigger aria-label="Permission preset">
          <span>Preset · {activePreset?.label ?? 'Custom'}</span>
        </SelectTrigger>
        {/* Pinned to the trigger width, or the Full access description would stretch the dropdown
            far wider than the selects above. */}
        <SelectContent className="w-(--radix-select-trigger-width)">
          {PERMISSION_PRESETS.map((preset) => (
            <SelectItem
              key={preset.id}
              value={preset.id}
              aria-describedby={
                preset.description === undefined ? undefined : `preset-${preset.id}-description`
              }
              className="items-start"
            >
              <span className="flex flex-col gap-0.5">
                <span>{preset.label}</span>
                {preset.description !== undefined && (
                  <span
                    id={`preset-${preset.id}-description`}
                    className="text-xs text-foreground-lighter"
                  >
                    {preset.description}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* The menu unmounts on select, so the announcement lives outside it to survive the close. */}
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </div>
  )
}
