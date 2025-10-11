'use client'

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

/**
 * @deprecated Use `import { Checkbox_shadcn_ } from "ui"` instead
 */
/**
 * A group of checkboxes.
 * @param {object} props - The component props.
 * @param {string} [props.id] - The ID of the group.
 * @param {'horizontal' | 'vertical'} [props.layout='vertical'] - The layout of the checkboxes.
 * @param {string} [props.error] - An error message to display.
 * @param {string} [props.descriptionText] - A description for the group.
 * @param {string} [props.label] - The label for the group.
 * @param {string} [props.afterLabel] - Text to display after the label.
 * @param {string} [props.beforeLabel] - Text to display before the label.
 * @param {string} [props.labelOptional] - Optional text to display next to the label.
 * @param {React.ReactNode} [props.children] - The checkbox elements.
 * @param {string} [props.className] - Additional CSS class names.
 * @param {InputProps[]} [props.options] - An array of options to create checkboxes from.
 * @param {Function} [props.onChange] - A callback function to be called when a checkbox is changed.
 * @param {'tiny' | 'small' | 'medium' | 'large' | 'xlarge'} [props.size='medium'] - The size of the checkboxes.
 * @returns {React.ReactElement} The checkbox group component.
 * @deprecated Use `import { Checkbox_shadcn_ } from "ui"` instead
 */
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

/**
 * A single checkbox input.
 * @param {object} props - The component props.
 * @param {string} [props.className] - Additional CSS class names.
 * @param {string} [props.id] - The ID of the checkbox.
 * @param {string} [props.name] - The name of the checkbox.
 * @param {string} [props.label] - The label for the checkbox.
 * @param {string} [props.afterLabel] - Text to display after the label.
 * @param {string} [props.beforeLabel] - Text to display before the label.
 * @param {string} [props.description] - A description for the checkbox.
 * @param {boolean} [props.checked] - Whether the checkbox is checked.
 * @param {string} [props.value] - The value of the checkbox.
 * @param {Function} [props.onChange] - A callback function to be called when the checkbox is changed.
 * @param {Function} [props.onBlur] - A callback function to be called when the checkbox loses focus.
 * @param {'tiny' | 'small' | 'medium' | 'large' | 'xlarge'} [props.size='medium'] - The size of the checkbox.
 * @param {boolean} [props.disabled=false] - If `true`, the checkbox will be disabled.
 * @returns {React.ReactElement} The checkbox component.
 * @deprecated Use ./Checkbox_shadcn_ instead
 */
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
