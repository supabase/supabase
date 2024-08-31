'use client'

import * as React from 'react'
import { type SelectTriggerProps } from '@radix-ui/react-select'

import { Button, cn } from 'ui'
import { useConfig } from '~/hooks/useConfig'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { frameworks, Framework } from '~/registry/frameworks'

export function StyleSwitcher({ className }: SelectTriggerProps) {
  const [config, setConfig] = useConfig()

  return (
    <Select_Shadcn_
      value={config.framework}
      onValueChange={(value: Framework['name']) =>
        setConfig({
          ...config,
          framework: value,
        })
      }
    >
      <SelectTrigger_Shadcn_
        className={cn('w-[210px] h-7 text-xs [&_svg]:h-4 [&_svg]:w-4', className)}
      >
        <div>
          {/* <span className="text-foreground-lighter">Framework: </span> */}
          <SelectValue_Shadcn_ placeholder="Select style" className="flex flex-start text-left" />
        </div>
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        {frameworks.map((framework) => (
          <SelectItem_Shadcn_ key={framework.name} value={framework.name} className="text-xs">
            {framework.label}
          </SelectItem_Shadcn_>
        ))}
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )
}
