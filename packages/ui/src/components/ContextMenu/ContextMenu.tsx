import React, { useState } from 'react'

import { IconCheck } from '../Icon/icons/IconCheck'

import type * as RadixContextMenuTypes from '@radix-ui/react-context-menu/'

import * as RadixContextMenu from '@radix-ui/react-context-menu'

const ContextMenuStyles = {}

interface RootProps {
  onOpenChange?(x: boolean): void
  alignOffset?: RadixContextMenuTypes.ContextMenuContentProps['alignOffset']
  overlay?: React.ReactNode
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

function ContextMenu({
  onOpenChange,

  alignOffset = 6,
  overlay,
  children,
  className,
  style,
}: RootProps) {
  // let classes = [ContextMenuStyles['sbui-contextmenu__content']]
  // if (className) {
  //   classes.push(className)
  // }
  return (
    <RadixContextMenu.Root onOpenChange={onOpenChange}>
      <RadixContextMenu.Trigger
      // className={ContextMenuStyles['sbui-contextmenu__trigger']}
      >
        {children}
      </RadixContextMenu.Trigger>

      <RadixContextMenu.Content
        alignOffset={alignOffset}
        // className={classes.join(' ')}
        style={style}
      >
        {overlay}
      </RadixContextMenu.Content>
    </RadixContextMenu.Root>
  )
}

interface ItemProps {
  children: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  onClick?: (event: Event) => void
}

export function Item({ children, icon, disabled, onClick }: ItemProps) {
  return (
    <RadixContextMenu.Item
      // className={ContextMenuStyles['sbui-contextmenu-item']}
      disabled={disabled}
      onSelect={onClick}
    >
      {icon && icon}
      <span>{children}</span>
    </RadixContextMenu.Item>
  )
}

export function Misc({ children, icon }: ItemProps) {
  return (
    <div
    // className={ContextMenuStyles['sbui-contextmenu-misc']}
    >
      {icon && icon}
      {children}
    </div>
  )
}

interface CheckboxProps {
  children: React.ReactNode
  checked?: boolean
  onChange?(x: boolean): void
  disabled?: boolean
  ItemIndicator?: React.ReactNode
}

export function Checkbox({
  children,
  checked: propsChecked,
  onChange,
  disabled,
  ItemIndicator,
}: CheckboxProps) {
  const [checked, setChecked] = useState(propsChecked ? propsChecked : false)

  const handleChange = (e: boolean) => {
    if (onChange) onChange(e)
    setChecked(e)
  }

  return (
    <RadixContextMenu.CheckboxItem
      checked={checked}
      onCheckedChange={handleChange}
      // className={`${ContextMenuStyles['sbui-contextmenu-item']} ${ContextMenuStyles['sbui-contextmenu-input']}`}
      disabled={disabled}
    >
      <RadixContextMenu.ItemIndicator
      // className={ContextMenuStyles['sbui-contextmenu-input__check']}
      >
        {ItemIndicator ? ItemIndicator : <IconCheck size="tiny" />}
        <RadixContextMenu.CheckboxItem />
      </RadixContextMenu.ItemIndicator>
      <span>{children}</span>
    </RadixContextMenu.CheckboxItem>
  )
}

interface RadioProps {
  children: React.ReactNode
  value: string
  ItemIndicator?: React.ReactNode
}

export function Radio({ children, value, ItemIndicator }: RadioProps) {
  return (
    <RadixContextMenu.RadioItem
      value={value}
      // className={`${ContextMenuStyles['sbui-contextmenu-item']} ${ContextMenuStyles['sbui-contextmenu-input']}`}
    >
      <RadixContextMenu.ItemIndicator
      // className={ContextMenuStyles['sbui-contextmenu-input__check']}
      >
        {ItemIndicator ? ItemIndicator : <IconCheck size="tiny" />}
      </RadixContextMenu.ItemIndicator>
      <span>{children}</span>
    </RadixContextMenu.RadioItem>
  )
}

interface RadioGroupProps {
  children: React.ReactNode
  value: string
  onChange?(x: string): void
}

export function RadioGroup({ children, value: propsValue, onChange }: RadioGroupProps) {
  const [value, setValue] = useState(propsValue ? propsValue : '')

  const handleChange = (e: string) => {
    if (onChange) onChange(e)
    setValue(e)
  }

  return (
    <RadixContextMenu.RadioGroup value={value} onValueChange={handleChange}>
      {children}
    </RadixContextMenu.RadioGroup>
  )
}

interface LabelProps {
  children: React.ReactNode
}

export function Label({ children }: LabelProps) {
  return (
    <RadixContextMenu.Label
    // className={ContextMenuStyles['sbui-contextmenu-label']}
    >
      {children}
    </RadixContextMenu.Label>
  )
}

ContextMenu.Item = Item
ContextMenu.Misc = Misc
ContextMenu.Checkbox = Checkbox
ContextMenu.Radio = Radio
ContextMenu.RadioGroup = RadioGroup
ContextMenu.Label = Label
export default ContextMenu
