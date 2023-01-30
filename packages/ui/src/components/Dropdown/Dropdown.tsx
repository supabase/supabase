import React, { useState } from 'react'

import * as RadixDropdown from '@radix-ui/react-dropdown-menu'
import { IconCheck } from '../Icon/icons/IconCheck'

// @ts-ignore
// import DropdownStyles from './Dropdown.module.css'

import type * as RadixDropdownTypes from '@radix-ui/react-dropdown-menu/'

import styleHandler from '../../lib/theme/styleHandler'
import { IconTarget } from '../Icon/icons/IconTarget'

interface RootProps {
  open?: boolean
  arrow?: boolean
  onOpenChange?: RadixDropdownTypes.DropdownMenuProps['onOpenChange'] //   DropdownMenu['onOpenChange']
  side?: RadixDropdownTypes.DropdownMenuContentProps['side']
  align?: RadixDropdownTypes.DropdownMenuContentProps['align']
  sideOffset?: RadixDropdownTypes.DropdownMenuContentProps['sideOffset']
  overlay?: React.ReactNode
  children?: React.ReactNode
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'content'
  className?: string
  style?: React.CSSProperties
  isNested?: Boolean
}

function Dropdown({
  open,
  onOpenChange,
  align = 'center', //Default value
  side = 'bottom', //Default value
  sideOffset = 6,
  overlay,
  children,
  size = 'medium',
  className,
  style,
  arrow,
  isNested,
}: RootProps) {
  let __styles = styleHandler('dropdown')

  let classes = [__styles.content, __styles.size[size]]
  if (className) {
    classes.push(className)
  }

  return (
    <RadixDropdown.Root onOpenChange={onOpenChange} open={open}>
      {isNested ? (
        <RadixDropdown.TriggerItem className={[__styles.item_nested].join(' ')}>
          {children}
        </RadixDropdown.TriggerItem>
      ) : (
        <RadixDropdown.Trigger className={__styles.trigger}>{children}</RadixDropdown.Trigger>
      )}

      <RadixDropdown.Content
        portalled={true}
        sideOffset={sideOffset}
        side={side}
        align={align}
        className={classes.join(' ')}
        style={style}
      >
        {arrow && (
          <RadixDropdown.Arrow className={__styles.arrow} offset={10}></RadixDropdown.Arrow>
        )}
        {overlay}
      </RadixDropdown.Content>
    </RadixDropdown.Root>
  )
}

export function RightSlot({ children }: any) {
  let __styles = styleHandler('dropdown')
  return <div className={__styles.right_slot}>{children}</div>
}

interface ItemProps {
  children: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  onClick?: (event: Event) => void
  rightSlot?: React.ReactNode
}

export function Item({ children, icon, disabled, onClick, rightSlot }: ItemProps) {
  let __styles = styleHandler('dropdown')

  return (
    <RadixDropdown.Item className={__styles.item} disabled={disabled} onSelect={onClick}>
      {icon && icon}
      <span>{children}</span>
    </RadixDropdown.Item>
  )
}

export function TriggerItem({ children, icon, disabled }: ItemProps) {
  let __styles = styleHandler('dropdown')
  return (
    <div className={__styles.item}>
      {icon && icon}
      <span>{children}</span>
    </div>
  )
}

export function Misc({ children, icon }: ItemProps) {
  let __styles = styleHandler('dropdown')
  return (
    <div className={__styles.misc}>
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

export function Separator() {
  let __styles = styleHandler('dropdown')

  return <RadixDropdown.Separator className={__styles.separator} />
}

export function Checkbox({
  children,
  checked: propsChecked,
  onChange,
  disabled,
  ItemIndicator,
}: CheckboxProps) {
  const [checked, setChecked] = useState(propsChecked ? propsChecked : false)

  let __styles = styleHandler('dropdown')

  const handleChange = (e: boolean) => {
    if (onChange) onChange(e)
    setChecked(e)
  }

  return (
    <RadixDropdown.CheckboxItem
      checked={checked}
      onCheckedChange={handleChange}
      className={`${__styles.item} ${__styles.input}`}
      disabled={disabled}
    >
      <RadixDropdown.ItemIndicator className={__styles.check}>
        {ItemIndicator ? ItemIndicator : <IconCheck size="tiny" strokeWidth={3} />}
        <RadixDropdown.CheckboxItem />
      </RadixDropdown.ItemIndicator>
      <span>{children}</span>
    </RadixDropdown.CheckboxItem>
  )
}

interface RadioProps {
  children: React.ReactNode
  value: string
  ItemIndicator?: React.ReactNode
}

export function Radio({ children, value, ItemIndicator }: RadioProps) {
  let __styles = styleHandler('dropdown')

  return (
    <RadixDropdown.RadioItem value={value} className={`${__styles.item} ${__styles.input}`}>
      <RadixDropdown.ItemIndicator className={__styles.check}>
        {ItemIndicator ? ItemIndicator : <IconTarget strokeWidth={6} size={10} />}
      </RadixDropdown.ItemIndicator>
      <span>{children}</span>
    </RadixDropdown.RadioItem>
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
    <RadixDropdown.RadioGroup value={value} onValueChange={handleChange}>
      {children}
    </RadixDropdown.RadioGroup>
  )
}

interface LabelProps {
  children: React.ReactNode
}

export function Label({ children }: LabelProps) {
  let __styles = styleHandler('dropdown')

  return <RadixDropdown.Label className={__styles.label}>{children}</RadixDropdown.Label>
}

Dropdown.Item = Item
Dropdown.Misc = Misc
Dropdown.Checkbox = Checkbox
Dropdown.Radio = Radio
Dropdown.RadioGroup = RadioGroup
Dropdown.Label = Label
Dropdown.Separator = Separator
Dropdown.RightSlot = RightSlot
Dropdown.TriggerItem = TriggerItem
export default Dropdown
