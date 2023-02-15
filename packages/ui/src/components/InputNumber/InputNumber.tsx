import React, { useEffect } from 'react'
import { FormLayout } from '../../lib/Layout/FormLayout'
import InputErrorIcon from '../../lib/Layout/InputErrorIcon'
import InputIconContainer from '../../lib/Layout/InputIconContainer'
import { useFormContext } from '../Form/FormContext'
import styleHandler from '../../lib/theme/styleHandler'

export interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  defaultValue?: string | number
  descriptionText?: string | React.ReactNode
  error?: string
  icon?: any
  inputRef?: React.RefObject<HTMLInputElement>
  label?: string
  afterLabel?: string
  beforeLabel?: string
  labelOptional?: string | React.ReactNode
  actions?: React.ReactNode
  layout?: 'horizontal' | 'vertical'
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  validation?: (x: any) => void
}

function InputNumber({
  defaultValue,
  descriptionText,
  error,
  icon,
  inputRef,
  label,
  afterLabel,
  beforeLabel,
  labelOptional,
  layout,
  value = undefined,
  actions,
  size = 'medium',
  validation,
  id = '',
  name = '',
  ...props
}: Props) {
  const __styles = styleHandler('inputNumber')

  const { formContextOnChange, values, errors, handleBlur, touched, fieldLevelValidation } =
    useFormContext()

  if (values && !value) value = values[id || name]

  function handleBlurEvent(e: React.FocusEvent<HTMLInputElement>) {
    if (handleBlur) handleBlur(e)
    if (props.onBlur) props.onBlur(e)
  }

  if (!error) {
    if (errors && !error) error = errors[id || name]
    error = touched && touched[id || name] ? error : undefined
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (props.onChange) props.onChange(e)
    // update form
    if (formContextOnChange) formContextOnChange(e)
    // run field level validation
    if (validation) fieldLevelValidation(id, validation(e.target.value))
  }

  useEffect(() => {
    if (validation) fieldLevelValidation(id, validation(value))
  }, [])

  let inputClasses = [__styles.base]

  if (error) inputClasses.push(__styles.variants.error)
  if (!error) inputClasses.push(__styles.variants.standard)
  if (icon) inputClasses.push(__styles.with_icon)
  if (size) inputClasses.push(__styles.size[size])
  if (props.disabled) inputClasses.push(__styles.disabled)

  return (
    <div className={props.className}>
      <FormLayout
        label={label}
        afterLabel={afterLabel}
        beforeLabel={beforeLabel}
        labelOptional={labelOptional}
        layout={layout}
        id={id}
        error={error}
        descriptionText={descriptionText}
        style={props.style}
        size={size}
      >
        <div className={__styles.container}>
          <input
            id={id}
            name={name}
            onChange={onInputChange}
            onBlur={handleBlurEvent}
            type={'number'}
            ref={inputRef}
            value={value}
            className={inputClasses.join(' ')}
            {...props}
          />
          {icon && <InputIconContainer icon={icon} />}
          {error || actions ? (
            <div className={__styles.actions_container}>
              {error && <InputErrorIcon size={size} />}
              {actions && actions}
            </div>
          ) : null}
        </div>
      </FormLayout>
    </div>
  )
}

export default InputNumber
