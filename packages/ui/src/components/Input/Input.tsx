'use client'

import { Copy } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { HIDDEN_PLACEHOLDER } from '../../lib/constants'
import { FormLayout } from '../../lib/Layout/FormLayout/FormLayout'
import InputErrorIcon from '../../lib/Layout/InputErrorIcon'
import InputIconContainer from '../../lib/Layout/InputIconContainer'
import styleHandler from '../../lib/theme/styleHandler'
import { copyToClipboard } from '../../lib/utils'
import { cn } from '../../lib/utils/cn'
import { Button } from '../Button'
import { useFormContext } from '../Form/FormContext'

export interface Props
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onCopy'> {
  inputClassName?: string
  iconContainerClassName?: string
  copy?: boolean
  onCopy?: () => void
  defaultValue?: string | number
  descriptionText?: string | React.ReactNode | undefined
  disabled?: boolean
  error?: string
  icon?: any
  inputRef?: React.LegacyRef<HTMLInputElement>
  label?: string | React.ReactNode
  afterLabel?: string
  beforeLabel?: string
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical'
  reveal?: boolean
  actions?: React.ReactNode
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  borderless?: boolean
  validation?: (x: any) => void
}

/**
 * @deprecated Use `import { Input_Shadcn_ } from 'ui'` instead or `import { Input } from 'ui-patterns/DataInputs/Input'`
 */
function Input({
  autoComplete,
  autoFocus,
  className,
  inputClassName,
  iconContainerClassName,
  copy,
  defaultValue,
  descriptionText,
  disabled,
  error,
  icon,
  id = '',
  name = '',
  inputRef,
  label,
  afterLabel,
  beforeLabel,
  labelOptional,
  layout,
  onChange,
  onBlur,
  onCopy,
  placeholder,
  type = 'text',
  value = undefined,
  style,
  reveal = false,
  actions,
  size = 'medium',
  borderless = false,
  validation,
  ...props
}: Props) {
  const [copyLabel, setCopyLabel] = useState('Copy')
  const [hidden, setHidden] = useState(true)

  const __styles = styleHandler('input')

  const { formContextOnChange, values, errors, handleBlur, touched, fieldLevelValidation } =
    useFormContext()

  if (values && !value) value = values[id || name]

  function handleBlurEvent(e: React.FocusEvent<HTMLInputElement>) {
    if (handleBlur) {
      setTimeout(() => {
        handleBlur(e)
      }, 100)
    }
    if (onBlur) onBlur(e)
  }

  if (!error) {
    if (errors && !error) error = errors[id || name]
    error = touched && touched[id] ? error : undefined
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // console.log('input event', e)
    if (onChange) onChange(e)
    // update form
    if (formContextOnChange) formContextOnChange(e)
    // run field level validation
    if (validation) fieldLevelValidation(id, validation(e.target.value))
  }

  useEffect(() => {
    if (validation) fieldLevelValidation(id, validation(value))
  }, [])

  // useEffect(() => {
  //   error = touched && touched[id] ? error : undefined
  // }, [errors, touched])

  function _onCopy(value: any) {
    copyToClipboard(value, () => {
      setCopyLabel('Copied')
      setTimeout(() => {
        setCopyLabel('Copy')
      }, 3000)
      onCopy?.()
    })
  }

  function onReveal() {
    setHidden(false)
  }

  let inputClasses = ['peer/input', __styles.base]

  if (error) inputClasses.push(__styles.variants.error)
  if (!error) inputClasses.push(__styles.variants.standard)
  if (size) inputClasses.push(__styles.size[size])
  if (icon) inputClasses.push(__styles.with_icon[size])
  if (disabled) inputClasses.push(__styles.disabled)
  if (inputClassName) inputClasses.push(inputClassName)

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
      style={style}
      size={size}
      className={className}
    >
      <div className={__styles.container}>
        <input
          data-size={size}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          defaultValue={defaultValue}
          disabled={disabled}
          id={id}
          name={name}
          onChange={onInputChange}
          onBlur={handleBlurEvent}
          onCopy={onCopy}
          placeholder={placeholder}
          ref={inputRef}
          type={type}
          value={reveal && hidden ? HIDDEN_PLACEHOLDER : value}
          className={cn(inputClasses)}
          {...props}
        />
        {icon && <InputIconContainer size={size} icon={icon} className={iconContainerClassName} />}
        {copy || error || actions ? (
          <div className={__styles.actions_container}>
            {error && <InputErrorIcon size={size} />}
            {copy && !(reveal && hidden) ? (
              <Button size="tiny" type="default" icon={<Copy />} onClick={() => _onCopy(value)}>
                {copyLabel}
              </Button>
            ) : null}
            {reveal && hidden ? (
              <Button size="tiny" type="default" onClick={onReveal}>
                Reveal
              </Button>
            ) : null}
            {actions && actions}
          </div>
        ) : null}
      </div>
    </FormLayout>
  )
}

/**
 * @deprecated Use ./TextArea_Shadcn_ instead
 */
export interface TextAreaProps
  extends Omit<React.InputHTMLAttributes<HTMLTextAreaElement>, 'size' | 'onCopy'> {
  textAreaClassName?: string
  descriptionText?: string | React.ReactNode | undefined
  error?: string
  icon?: any
  label?: string | React.ReactNode
  afterLabel?: string
  beforeLabel?: string
  labelOptional?: string | React.ReactNode
  layout?: 'horizontal' | 'vertical'
  rows?: number
  limit?: number
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  borderless?: boolean
  validation?: (x: any) => void
  copy?: boolean
  onCopy?: () => void
  actions?: React.ReactNode
}

function TextArea({
  className,
  textAreaClassName,
  descriptionText,
  disabled,
  error,
  icon,
  id = '',
  name = '',
  label,
  afterLabel,
  beforeLabel,
  labelOptional,
  layout,
  onChange,
  onBlur,
  placeholder,
  value,
  style,
  rows = 4,
  limit,
  size = 'medium',
  borderless = false,
  validation,
  copy = false,
  onCopy,
  actions,
  ...props
}: TextAreaProps) {
  const [charLength, setCharLength] = useState(0)
  const [copyLabel, setCopyLabel] = useState('Copy')

  function _onCopy(value: any) {
    copyToClipboard(value, () => {
      /* clipboard successfully set */
      setCopyLabel('Copied')
      setTimeout(() => {
        setCopyLabel('Copy')
      }, 3000)
      onCopy?.()
    })
  }

  const { formContextOnChange, values, errors, handleBlur, touched, fieldLevelValidation } =
    useFormContext()

  if (values && !value) value = values[id || name]

  function handleBlurEvent(e: React.FocusEvent<HTMLTextAreaElement>) {
    if (handleBlur) {
      setTimeout(() => {
        handleBlur(e)
      }, 100)
    }
    if (onBlur) onBlur(e)
  }

  if (!error) {
    if (errors && !error) error = errors[id || name]
    error = touched && touched[id || name] ? error : undefined
  }

  function onInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setCharLength(e.target.value.length)
    if (onChange) onChange(e)
    // update form
    if (formContextOnChange) formContextOnChange(e)
    // run field level validation
    if (validation) fieldLevelValidation(id, validation(e.target.value))
  }

  useEffect(() => {
    if (validation) fieldLevelValidation(id, validation(value))
  }, [])

  const __styles = styleHandler('input')

  let classes = [__styles.base]

  if (error) classes.push(__styles.variants.error)
  if (!error) classes.push(__styles.variants.standard)
  if (icon) classes.push(__styles.with_icon[size])
  if (size) classes.push(__styles.size[size])
  if (disabled) classes.push(__styles.disabled)
  if (textAreaClassName) classes.push(textAreaClassName)

  return (
    <FormLayout
      className={className}
      label={label}
      afterLabel={afterLabel}
      beforeLabel={beforeLabel}
      labelOptional={labelOptional}
      layout={layout}
      id={id}
      error={error}
      descriptionText={descriptionText}
      style={style}
      size={size}
    >
      <div className={__styles.container}>
        <textarea
          disabled={disabled}
          id={id}
          name={name}
          rows={rows}
          cols={100}
          placeholder={placeholder}
          onChange={onInputChange}
          onBlur={handleBlurEvent}
          onCopy={onCopy}
          value={value}
          className={classes.join(' ')}
          maxLength={limit}
          {...props}
        />
        {copy || error || actions ? (
          <div className={__styles['textarea_actions_container']}>
            <div className={__styles['textarea_actions_container_items']}>
              {error && <InputErrorIcon size={size} />}
              {copy && (
                <Button size="tiny" type="default" onClick={() => _onCopy(value)} icon={<Copy />}>
                  {copyLabel}
                </Button>
              )}
              {actions && actions}
            </div>
          </div>
        ) : null}
      </div>
    </FormLayout>
  )
}

Input.TextArea = TextArea

export default Input
