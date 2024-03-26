import React, { useEffect } from 'react'

import { FormLayout } from '../../lib/Layout/FormLayout/FormLayout'
import InputErrorIcon from '../../lib/Layout/InputErrorIcon'
import InputIconContainer from '../../lib/Layout/InputIconContainer'
import styleHandler from '../../lib/theme/styleHandler'
import { useFormContext } from '../Form/FormContext'

interface OptionProps {
  value: string
  children: React.ReactNode
  selected?: boolean
}

interface OptGroupProps {
  label: string
  children: React.ReactNode
}

export interface Props extends Omit<React.InputHTMLAttributes<HTMLSelectElement>, 'size'> {
  autofocus?: boolean
  children: React.ReactNode
  descriptionText?: string
  error?: string
  icon?: any
  inputRef?: string
  label?: string
  afterLabel?: string
  beforeLabel?: string
  labelOptional?: string
  layout?: 'horizontal' | 'vertical'
  reveal?: boolean
  actions?: React.ReactNode
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  borderless?: boolean
  validation?: (x: any) => void
}

export const ColLayout = (props: any) => <div>{props.children}</div>

function Select({
  autoComplete,
  autofocus,
  children,
  className,
  descriptionText,
  disabled,
  error,
  icon,
  id = '',
  inputRef,
  label,
  afterLabel,
  beforeLabel,
  labelOptional,
  layout,
  name = '',
  onChange,
  onBlur,
  placeholder,
  required,
  value = undefined,
  defaultValue = undefined,
  style,
  size = 'medium',
  borderless = false,
  validation,
  ...props
}: Props) {
  const { formContextOnChange, values, errors, handleBlur, touched, fieldLevelValidation } =
    useFormContext()

  if (values && !value) value = values[id]
  function handleBlurEvent(e: React.FocusEvent<HTMLSelectElement>) {
    if (handleBlur) handleBlur(e)
    if (onBlur) onBlur(e)
  }

  if (!error) {
    if (errors && !error) error = errors[id || name]
    error = touched && touched[id || name] ? error : undefined
  }

  function onInputChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (onChange) onChange(e)
    // update form
    if (formContextOnChange) formContextOnChange(e)
    // run field level validation
    if (validation) fieldLevelValidation(id, validation(e.target.value))
  }

  useEffect(() => {
    if (validation) fieldLevelValidation(id, validation(value))
  }, [])

  const __styles = styleHandler('select')

  let classesContainer = [__styles.container]
  if (className) classesContainer.push(className)

  let classes = [__styles.base]
  if (error) classes.push(__styles.variants.error)
  if (!error) classes.push(__styles.variants.standard)
  if (icon) classes.push(__styles.with_icon)
  if (size) classes.push(__styles.size[size])
  if (disabled) classes.push(__styles.disabled)

  return (
    <FormLayout
      label={label}
      afterLabel={afterLabel}
      beforeLabel={beforeLabel}
      labelOptional={labelOptional}
      layout={layout}
      id={id}
      error={error}
      descriptionText={descriptionText}
      className={className}
      style={style}
      size={size}
    >
      <div className={__styles.container}>
        <select
          id={id}
          name={name}
          data-size={size}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          autoFocus={autofocus}
          className={classes.join(' ')}
          onChange={onInputChange}
          onBlur={handleBlurEvent}
          ref={inputRef}
          value={value}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          {...props}
        >
          {children}
        </select>
        {icon && <InputIconContainer size={size} icon={icon} />}
        {error && (
          <div className={__styles.actions_container}>
            {error && <InputErrorIcon size={size} />}
          </div>
        )}
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
      </div>
    </FormLayout>
  )
}

export function Option({ value, children, selected }: OptionProps) {
  return (
    <option value={value} selected={selected}>
      {children}
    </option>
  )
}

export function OptGroup({ label, children }: OptGroupProps) {
  return <optgroup label={label}>{children}</optgroup>
}

Select.Option = Option
Select.OptGroup = OptGroup

export default Select
