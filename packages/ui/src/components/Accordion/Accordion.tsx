import * as RadixAccordion from '@radix-ui/react-accordion'
import React, { createContext, useContext, useState } from 'react'

import styleHandler from '../../lib/theme/styleHandler'
import { IconChevronDown } from '../Icon/icons/IconChevronDown'

type Type = 'default' | 'bordered'
type Size = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
type Align = 'left' | 'right'

interface ContextValue {
  bordered?: boolean
  type: Type
  justified: Boolean
  chevronAlign: Align
}

const AccordionContext = createContext<ContextValue>({
  chevronAlign: 'left',
  justified: true,
  type: 'default',
})

export interface AccordionProps {
  children?: React.ReactNode
  className?: string
  defaultActiveId?: (string | number)[]
  icon?: React.ReactNode
  iconPosition?: Align
  onChange?: (item: string | string[]) => void
  openBehaviour: 'single' | 'multiple'
  type?: Type
  size?: Size
  defaultValue?: string | string[] | undefined
  justified?: Boolean
  chevronAlign?: Align
}

function Accordion({
  children,
  className,
  onChange,
  openBehaviour = 'multiple',
  type = 'default',
  defaultValue = undefined,
  justified = false,
  chevronAlign = 'left',
}: AccordionProps) {
  const __styles = styleHandler('accordion')

  let containerClasses = [__styles.variants[type].base]

  if (className) {
    containerClasses.push(className)
  }

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
    // console.log('about to change state')
    // currentItems = e
    // console.log('currentItems', currentItems)
  }

  return (
    <>
      {/* @ts-expect-error */}
      <RadixAccordion.Root
        type={openBehaviour}
        onValueChange={handleOnChange}
        defaultValue={defaultValue}
        className={containerClasses.join(' ')}
      >
        <AccordionContext.Provider value={{ ...contextValue }}>
          <div>{children}</div>
        </AccordionContext.Provider>
      </RadixAccordion.Root>
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

export function Item({ children, className, header, id, disabled }: ItemProps) {
  const __styles = styleHandler('accordion')
  const [open, setOpen] = useState(false)

  const { type, justified, chevronAlign } = useContext(AccordionContext)

  let triggerClasses = [__styles.variants[type].trigger]
  if (justified) triggerClasses.push(__styles.justified)
  if (className) triggerClasses.push(className)

  let chevronClasses = [__styles.chevron.base, __styles.chevron.align[chevronAlign]]

  if (open && !disabled) {
    chevronClasses.unshift('!rotate-180')
  }

  return (
    // @ts-ignore TODO: investigate why this is making TS angry
    <RadixAccordion.Item
      value={id}
      className={__styles.variants[type].container}
      disabled={disabled}
      onClick={() => {
        setOpen(!open)
      }}
    >
      {/* @ts-ignore TODO: investigate why this is making TS angry */}
      <RadixAccordion.Trigger className={triggerClasses.join(' ')}>
        {header}
        {!disabled && (
          <IconChevronDown aria-hidden className={chevronClasses.join(' ')} strokeWidth={2} />
        )}
      </RadixAccordion.Trigger>
      {/* @ts-ignore TODO: investigate why this is making TS angry */}
      <RadixAccordion.Content className={__styles.variants[type].content}>
        <div className={__styles.variants[type].panel}>{children}</div>
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  )
}

Accordion.Item = Item
export default Accordion
