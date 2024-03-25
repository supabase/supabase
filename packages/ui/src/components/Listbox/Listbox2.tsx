import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { flatten } from 'lodash'
import React, { useEffect, useRef, useState } from 'react'

import { FormLayout } from '../../lib/Layout/FormLayout/FormLayout'
import InputErrorIcon from '../../lib/Layout/InputErrorIcon'
import InputIconContainer from '../../lib/Layout/InputIconContainer'
import styleHandler from '../../lib/theme/styleHandler'
import { cn } from '../../lib/utils/cn'
import { useFormContext } from '../Form/FormContext'
import { IconCheck } from '../Icon/icons/IconCheck'
import { SelectContext } from './SelectContext'

export interface Props extends Omit<React.InputHTMLAttributes<HTMLButtonElement>, 'size'> {
  className?: string
  buttonClassName?: string
  children: React.ReactNode
  descriptionText?: string | React.ReactNode
  error?: string
  icon?: any
  id?: string
  label?: string | React.ReactNode
  labelOptional?: string
  layout?: 'horizontal' | 'vertical'
  style?: React.CSSProperties
  value?: any
  reveal?: boolean
  actions?: React.ReactNode
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  defaultValue?: any
  validation?: (x: any) => void
  optionsWidth?: number
  // override the button prop for onchange we only return a single value
  // rather than a ChangeEvent<HTMLButtonElement>
  onChange?: (x: any) => void
}

/**
 * @deprecated The component should not be used
 */
function Listbox({
  children,
  className,
  buttonClassName,
  descriptionText,
  error,
  icon,
  id = '',
  name = '',
  label,
  labelOptional,
  layout,
  value = undefined,
  onChange,
  onFocus,
  onBlur,
  style,
  size = 'medium',
  defaultValue,
  validation,
  disabled,
  optionsWidth,
}: Props) {
  const [selected, setSelected] = useState(undefined)
  const [selectedNode, setSelectedNode] = useState<any>({})

  const __styles = styleHandler('listbox')

  const triggerRef = useRef<HTMLButtonElement>(null)

  const { formContextOnChange, values, errors, handleBlur, touched, fieldLevelValidation } =
    useFormContext()

  if (values && !value) {
    value = values[id || name]
    defaultValue = values[id || name]
  }

  function handleBlurEvent(e: React.FocusEvent<HTMLButtonElement>) {
    if (handleBlur) handleBlur(e)
    if (onBlur) onBlur(e)
  }

  if (!error) {
    if (errors && !error) error = errors[id || name]
    error = touched && touched[id || name] ? error : undefined
  }

  useEffect(() => {
    if (value !== undefined) {
      setSelected(value)
    }
  }, [value])

  useEffect(() => {
    // handle listbox options width size

    function handleResize() {
      // Set window width/height to state

      // [Joshen] Note this causes some style conflicts if there are multiple listboxes
      // rendered on the same page. All listbox option widths will be that of the latest
      // listbox component that got rendered, rather than following its parent
      document.documentElement.style.setProperty(
        '--width-listbox',
        `${optionsWidth ? optionsWidth : triggerRef.current?.offsetWidth}px`
      )
    }

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Call handler right away so state gets updated with initial window size
    handleResize()

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const data: any = children
    const content: any = flatten(data)

    function findNode(_value: any) {
      return content.find((node: any) => node.props.value === _value)
    }

    /*
     * value prop overrides everything
     */
    if (value) {
      setSelected(value)
      const node: any = findNode(value)
      setSelectedNode(node?.props ? node.props : undefined)
      return
    }

    /*
     * if no value prop, then use selected state
     */
    if (selected) {
      const node: any = findNode(selected)
      setSelectedNode(node?.props ? node.props : undefined)
      return
    } else if (defaultValue) {
      setSelected(defaultValue)
      const node: any = findNode(selected)
      setSelectedNode(node?.props ? node.props : undefined)
      return
    } else {
      /*
       * if no selected value (including a `defaultvalue`), then use first child
       */
      setSelectedNode(content[0]?.props)
      return
    }
  }, [selected])

  function handleOnChange(value: any) {
    if (onChange) onChange(value)
    setSelected(value)

    /*
     * Create change event for formik
     * formik expects an input change event
     */
    let event: any = {}
    event.target = {
      type: 'select',
      name: name,
      id: id,
      value: value,
      checked: undefined,
      // outerHTML: undefined,
      // options: undefined,
      // multiple: undefined,
    }

    // update form
    // Create a new 'change' event
    if (formContextOnChange) formContextOnChange(event)
    // run field level validation
    if (validation) fieldLevelValidation(id, validation(value))
  }

  let selectClasses = [__styles.container, __styles.base, buttonClassName]
  let addonBeforeClasses = [__styles.addOnBefore]

  if (error) selectClasses.push(__styles.variants.error)
  if (!error) selectClasses.push(__styles.variants.standard)
  // if (icon) selectClasses.push(SelectStyles['sbui-listbox--with-icon'])
  if (icon) addonBeforeClasses.push(__styles.with_icon)
  // if (size) selectClasses.push(SelectStyles[`sbui-listbox--${size}`])
  if (size) selectClasses.push(__styles.size[size])
  // if (borderless) selectClasses.push(SelectStyles['sbui-listbox--borderless'])
  if (disabled) selectClasses.push(__styles.disabled)

  return (
    <FormLayout
      label={label}
      labelOptional={labelOptional}
      layout={layout}
      id={id}
      error={error}
      descriptionText={descriptionText}
      className={className}
      style={style}
      size={size}
    >
      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger asChild disabled={disabled}>
          <button
            data-size={size}
            ref={triggerRef}
            className={cn(selectClasses)}
            onBlur={handleBlurEvent}
            onFocus={onFocus}
            name={name}
            id={id}
          >
            <span className={cn(addonBeforeClasses)}>
              {icon && <InputIconContainer size={size} icon={icon} />}
              {selectedNode?.addOnBefore && <selectedNode.addOnBefore />}
              <span className={__styles.label}>{selectedNode?.label}</span>
            </span>
            <span className={__styles.chevron_container}>
              <svg
                className={__styles.chevron}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            {error && (
              <div className={__styles.actions_container}>
                {error && <InputErrorIcon size={size} />}
              </div>
            )}
          </button>
        </DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Content
          sideOffset={6}
          loop={true}
          side={'bottom'}
          align="center"
          className={__styles.options_container}
        >
          <div>
            <SelectContext.Provider value={{ onChange: handleOnChange, selected }}>
              {children}
            </SelectContext.Provider>
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Root>
    </FormLayout>
  )
}

interface OptionProps {
  id?: string
  value: any
  label: string
  disabled?: boolean
  children?: React.ReactNode | (({ active, selected }: any) => React.ReactNode)
  className?: string
  addOnBefore?: ({ active, selected }: any) => React.ReactNode
}

type addOnBefore = {
  selected: boolean
  active: boolean
}

function SelectOption({
  id,
  value,
  label,
  disabled = false,
  children,
  className = '',
  addOnBefore,
}: OptionProps) {
  const __styles = styleHandler('listbox')

  return (
    <SelectContext.Consumer>
      {({ onChange, selected }) => {
        const active = selected === value ? true : false

        return (
          <DropdownMenuPrimitive.Item
            key={id}
            className={cn(
              __styles.option,
              active ? __styles.option_active : ' ',
              disabled ? __styles.option_disabled : ' ',
              className
            )}
            onSelect={() => (!disabled ? onChange(value) : {})}
          >
            <div className={__styles.option_inner}>
              {addOnBefore && addOnBefore({ active, selected })}
              <span>
                {typeof children === 'function' ? children({ active, selected }) : children}
              </span>
            </div>

            {active ? (
              <span
                className={cn(__styles.option_check, active ? __styles.option_check_active : '')}
              >
                <IconCheck className={__styles.option_check_icon} aria-hidden="true" />
              </span>
            ) : null}
          </DropdownMenuPrimitive.Item>
        )
      }}
    </SelectContext.Consumer>
  )
}

Listbox.Option = SelectOption

export default Listbox
