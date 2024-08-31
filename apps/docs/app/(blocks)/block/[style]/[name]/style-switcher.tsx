'use client'

import * as React from 'react'
import { type SelectTriggerProps } from '@radix-ui/react-select'

import { cn } from 'ui'
import { useConfig } from '~/hooks/use-config'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Style, styles } from '~/registry/styles'

export function StyleSwitcher({ className }: SelectTriggerProps) {
  const [config, setConfig] = useConfig()

  return (
    <Select_Shadcn_
      value={config.style}
      onValueChange={(value: Style['name']) =>
        setConfig({
          ...config,
          style: value,
        })
      }
    >
      <SelectTrigger_Shadcn_
        className={cn('h-7 w-[145px] text-xs [&_svg]:h-4 [&_svg]:w-4', className)}
      >
        <span className="text-muted-foreground">Style: </span>
        <SelectValue_Shadcn_ placeholder="Select style" />
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        {styles.map((style) => (
          <SelectItem_Shadcn_ key={style.name} value={style.name} className="text-xs">
            {style.label}
          </SelectItem_Shadcn_>
        ))}
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )
}
