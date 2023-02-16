import React, { createContext, useContext, useState } from 'react'

import { IconChevronUp } from '../Icon/icons/IconChevronUp'
import styleHandler from '../../lib/theme/styleHandler'

import * as RadixAccordion from '@radix-ui/react-accordion'
import { IconChevronDown } from '../Icon/icons/IconChevronDown'
import { Transition } from '@headlessui/react'

// type ContextValue = Required<
//   Pick<AccordionProps, 'defaultActiveId' | 'icon' | 'iconPosition'>
// > &
//   Pick<AccordionProps, 'onChange'>

type Type = 'default' | 'bordered'
type Size = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
type Align = 'left' | 'right'

interface ContextValue {
  bordered?: boolean
  type: Type
  justified: Boolean
  chevronAlign: Align
  // currentItems: string[]
}

const AccordionContext = createContext<ContextValue>({
  chevronAlign: 'left',
  justified: true,
  type: 'default',
  // currentItems: [],
})

interface AccordionProps {
  children?: React.ReactNode
  className?: string
  defaultActiveId?: (string | number)[]
  icon?: React.ReactNode
  iconPosition?: Align
  bordered: boolean
  onChange?: (item: string | string[]) => void
  openBehaviour: 'single' | 'multiple'
  type: Type
  size: Size
  defaultValue?: string | string[] | undefined
  justified: Boolean
  chevronAlign: Align
}

function Accordion({
  children,
  className,
  defaultActiveId = [],
  icon = <IconChevronUp strokeWidth={2} />,
  iconPosition = 'right',
  onChange,
  openBehaviour = 'multiple',
  type = 'default',
  // size, // TO DO
  defaultValue = undefined,
  justified = true,
  chevronAlign,
}: AccordionProps) {
  // const [currentItems, setCurrentItems] = useState(defaultValue || [])

  const __styles = styleHandler('accordion')

  let containerClasses = [__styles.variants[type].base]

  if (className) {
    containerClasses.push(className)
  }

  // let currentItems = defaultValue || []

  const contextValue = {
    chevronAlign,
    justified,
    type,
    defaultValue,
  }

  function handleOnChange(e: string | string[]) {
    if (onChange) onChange(e)
    const value = e == typeof String ? e.split(' ') : e
    // setCurrentItems(e)
    console.log('about to change state')
    // currentItems = e
    // console.log('currentItems', currentItems)
  }

  return (
    <>
      {/* @ts-ignore */}
      <RadixAccordion.Root
        type={openBehaviour}
        onValueChange={handleOnChange}
        defaultValue={defaultValue}
        className={containerClasses.join(' ')}
        children={
          <AccordionContext.Provider value={{ ...contextValue }}>
            <div className={containerClasses.join(' ')}>{children}</div>
          </AccordionContext.Provider>
        }
      ></RadixAccordion.Root>
    </>
  )
}

interface ItemProps {
  children?: React.ReactNode
  className?: string
  header: React.ReactNode
  id: string
  icon?: React.ReactNode
  disabled?: boolean
}

export function Item({ children, className, header, id, icon, disabled }: ItemProps) {
  const __styles = styleHandler('accordion')
  const [open, setOpen] = useState(false)

  const {
    type,
    justified,
    chevronAlign,
    // currentItems,
    // defaultActiveId, iconPosition, onChange
  } = useContext(AccordionContext)

  let triggerClasses = [__styles.variants[type].trigger]
  if (justified) triggerClasses.push(__styles.justified)
  if (className) triggerClasses.push(className)

  let chevronClasses = [__styles.chevron.base, __styles.chevron.align[chevronAlign]]

  // console.log('currentItems', currentItems)
  if (open && !disabled) {
    chevronClasses.unshift('!rotate-180')
  }

  return (
    <RadixAccordion.Item
      value={id}
      className={__styles.variants[type].container}
      disabled={disabled}
      onClick={() => {
        setOpen(!open)
      }}
    >
      <RadixAccordion.Trigger className={triggerClasses.join(' ')}>
        {header}
        {!disabled && (
          <IconChevronDown aria-hidden className={chevronClasses.join(' ')} strokeWidth={2} />
        )}
      </RadixAccordion.Trigger>
      <RadixAccordion.Content className={__styles.variants[type].content}>
        <div className={__styles.variants[type].panel}>{children}</div>
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  )
}

Accordion.Item = Item
export default Accordion
