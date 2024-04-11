import React from 'react'

import { FormLayout } from '../../lib/Layout/FormLayout/FormLayout'
import styleHandler from '../../lib/theme/styleHandler'
import { useFormContext } from '../Form/FormContext'
import CheckboxStyles from './Checkbox.module.css'
import { CheckboxContext } from './CheckboxContext'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  afterLabel?: string
  beforeLabel?: string
  description?: string
  label?: string
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
}

interface GroupProps {
  id?: string
  layout?: 'horizontal' | 'vertical'
  error?: any
  descriptionText?: any
  label?: any
  afterLabel?: string
  beforeLabel?: string
  labelOptional?: any
  name?: any
  value?: any
  className?: string
  children?: React.ReactNode
  options?: Array<InputProps>
  defaultValue?: string
  onChange?(x: React.ChangeEvent<HTMLInputElement>): void
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
}

function Group({
  id,
  layout = 'vertical',
  error,
  descriptionText,
  label,
  afterLabel,
  beforeLabel,
  labelOptional,
  children,
  className,
  options,
  onChange,
  size = 'medium',
}: GroupProps) {
  const parentCallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e)
  }

  const __styles = styleHandler('checkbox')

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
      size={size}
    >
      <CheckboxContext.Provider value={{ parentCallback, parentSize: size }}>
        <div className={__styles.group}>
          {options
            ? options.map((option: InputProps) => {
                return (
                  <Checkbox
                    id={option.id}
                    key={option.id}
                    value={option.value}
                    label={option.label}
                    beforeLabel={option.beforeLabel}
                    afterLabel={option.afterLabel}
                    checked={option.checked}
                    name={option.name}
                    description={option.description}
                    defaultChecked={option.defaultChecked}
                  />
                )
              })
            : children}
        </div>
      </CheckboxContext.Provider>
    </FormLayout>
  )
}

export function Checkbox({
  className,
  id = '',
  name = '',
  label,
  afterLabel,
  beforeLabel,
  description,
  checked,
  value,
  onChange,
  onBlur,
  size = 'medium',
  disabled = false,
  ...props
}: InputProps) {
  const { formContextOnChange, values, handleBlur } = useFormContext()

  const __styles = styleHandler('checkbox')

  return (
    <CheckboxContext.Consumer>
      {({ parentCallback, parentSize }) => {
        // if id does not exist, use label
        const markupId = id
          ? id
          : name
            ? name
            : label
              ? label
                  .toLowerCase()
                  .replace(/^[^A-Z0-9]+/gi, '')
                  .replace(/ /g, '-')
              : undefined

        // @ts-ignore
        size = parentSize ? parentSize : size

        // if name does not exist on Radio then use Context Name from Radio.Group
        // if that fails, use the id
        const markupName = name ? name : markupId

        // check if checkbox checked is true or false
        // if neither true or false the checkbox will rely on native control
        let active = checked ?? undefined

        // if (values && !value) value = values[id || name]

        let containerClasses = [__styles.container]

        function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
          // '`onChange` callback for parent component
          if (parentCallback) parentCallback(e)
          // '`onChange` callback for this component
          if (onChange) onChange(e)
          // update form
          if (formContextOnChange) formContextOnChange(e)
        }

        if (className) containerClasses.push(className)

        if (values && checked === undefined) active = values[id || name]

        function handleBlurEvent(e: React.FocusEvent<HTMLInputElement>) {
          if (handleBlur) {
            setTimeout(() => {
              handleBlur(e)
            }, 100)
          }
          if (onBlur) onBlur(e)
        }

        return (
          <div className={containerClasses.join(' ')}>
            <input
              id={markupId}
              name={markupName}
              type="checkbox"
              className={[__styles.base, __styles.size[size]].join(' ')}
              onChange={onInputChange}
              onBlur={handleBlurEvent}
              checked={active}
              value={value ? value : markupId}
              disabled={disabled}
              {...props}
            />

            <label
              className={[__styles.label.base, __styles.label[size]].join(' ')}
              htmlFor={markupId}
            >
              <span>
                {beforeLabel && (
                  <span
                    className={[__styles.label_before.base, __styles.label_before[size]].join(' ')}
                  >
                    {beforeLabel}
                  </span>
                )}
                {label}
                {afterLabel && (
                  <span
                    className={[__styles.label_after.base, __styles.label_after[size]].join(' ')}
                  >
                    {afterLabel}
                  </span>
                )}
              </span>

              {description && (
                <p className={[__styles.description.base, __styles.description[size]].join(' ')}>
                  {description}
                </p>
              )}
            </label>
          </div>
        )
      }}
    </CheckboxContext.Consumer>
  )
}

Checkbox.Group = Group
export default Checkbox
