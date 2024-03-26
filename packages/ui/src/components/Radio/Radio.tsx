import React, { useEffect, useState } from 'react'

import { FormLayout } from '../../lib/Layout/FormLayout/FormLayout'
import styleHandler from '../../lib/theme/styleHandler'
import { useFormContext } from '../Form/FormContext'
import { generateUID } from './../../lib/utils/randomIdGenerator'
import { RadioContext } from './RadioContext'

interface GroupProps {
  allowedValues?: any
  checkboxes?: any
  id?: any
  layout?: 'horizontal' | 'vertical'
  error?: any
  descriptionText?: any
  label?: any
  afterLabel?: string
  beforeLabel?: string
  labelOptional?: any
  name?: any
  type?: 'cards' | 'list' | 'small-cards' | 'large-cards'
  transform?: any
  value?: any
  className?: any
  children?: React.ReactNode
  options?: Array<InputProps>
  onChange?(x: React.ChangeEvent<HTMLInputElement>): void
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  validation?: (x: any) => void
  groupClassName?: string
  labelsLayout?: 'horizontal' | 'vertical'
}

function RadioGroup({
  id,
  layout,
  error,
  descriptionText,
  label,
  afterLabel,
  beforeLabel,
  labelOptional,
  children,
  className,
  type = 'list',
  options,
  value,
  name,
  onChange,
  size = 'medium',
  validation,
  groupClassName,
  labelsLayout = 'vertical',
}: GroupProps) {
  const [activeId, setActiveId] = useState('')

  const __styles = styleHandler('radio')

  const {
    formContextOnChange,
    values,
    errors,
    // handleBlur,
    touched,
    fieldLevelValidation,
  } = useFormContext()

  if (values && !value) value = values[id || name]
  // console.log('errors in. radio group', errors)
  // console.log('values in radio group', values)

  if (!error) {
    if (errors && !error) error = errors[id || name]
    error = touched && touched[id || name] ? error : undefined
  }

  useEffect(() => {
    if (validation) fieldLevelValidation(id, validation(value))
  }, [])

  useEffect(() => {
    setActiveId(value)
  }, [value])

  function parentCallback(e: React.ChangeEvent<HTMLInputElement>) {
    if (onChange) onChange(e)
    // update form
    if (formContextOnChange) {
      formContextOnChange(e)
    }
    // run field level validation
    if (validation) fieldLevelValidation(id, validation(e.target.value))
    setActiveId(e.target.id)
  }

  return (
    <fieldset name={name} className={className}>
      <FormLayout
        nonBoxInput={true}
        label={label}
        afterLabel={afterLabel}
        beforeLabel={beforeLabel}
        labelOptional={labelOptional}
        layout={layout}
        id={id}
        error={error}
        descriptionText={descriptionText}
        size={size}
        labelLayout={labelsLayout}
      >
        <div className={groupClassName || __styles.variants[type].group}>
          <RadioContext.Provider value={{ parentCallback, type, name, activeId, parentSize: size }}>
            {options
              ? options.map((option: InputProps) => {
                  return (
                    <Radio
                      id={option.id}
                      label={option.label}
                      beforeLabel={option.beforeLabel}
                      afterLabel={option.afterLabel}
                      value={option.value}
                      description={option.description}
                    />
                  )
                })
              : children}
          </RadioContext.Provider>
        </div>
      </FormLayout>
    </fieldset>
  )
}

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string | React.ReactNode
  afterLabel?: string | React.ReactNode
  beforeLabel?: string | React.ReactNode
  description?: string | React.ReactNode
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  hidden?: boolean
  align?: 'vertical' | 'horizontal'
  optionalLabel?: 'string' | React.ReactNode
  addOnBefore?: React.ReactNode
  children?: React.ReactNode
}

function Radio({
  id = generateUID(),
  disabled,
  value,
  label,
  afterLabel,
  beforeLabel,
  description,
  name,
  checked,
  className,
  onChange,
  onBlur,
  hidden = false,
  size = 'medium',
  align = 'vertical',
  optionalLabel,
  addOnBefore,
  children,
}: InputProps) {
  const __styles = styleHandler('radio')

  const inputName = name

  const { handleBlur } = useFormContext()

  function handleBlurEvent(e: React.FocusEvent<HTMLInputElement>) {
    if (handleBlur) handleBlur(e)
    if (onBlur) onBlur(e)
  }

  return (
    <RadioContext.Consumer>
      {({ parentCallback, type, name, activeId, parentSize }) => {
        // if id does not exist, use label

        const markupId = id

        // if name does not exist on Radio then use Context Name from Radio.Group
        const markupName = name || inputName

        // console.log('markupName', markupName)
        // @ts-ignore
        size = parentSize || size

        // check if radio id is via parent component
        // then check if radio checked prop is true or false
        // if no boolean exists the checkbox will rely on native control
        const active =
          activeId === markupId ? true : checked ? true : checked === false ? false : undefined

        let classes = [
          className,
          __styles.variants[type].container.base,
          // __styles.variants[type].container.align[align],
          type === 'list' && !hidden && __styles.variants[type].container.size[size],
        ]

        classes.push(__styles.variants[type].base)
        classes.push(__styles.variants[type].size[size])

        if (active) {
          classes.push(__styles.variants[type].active)
        } else {
          classes.push(__styles.variants[type].inactive)
        }

        if (disabled) {
          classes.push(__styles.disabled)
        }

        if (type !== 'list') hidden = true

        function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
          // '`onChange` callback for parent component
          if (parentCallback) {
            parentCallback(e)
          }
          // '`onChange` callback for this component
          if (onChange) onChange(e)
        }

        return (
          <label htmlFor={markupId} className={classes.join(' ')}>
            <input
              id={markupId}
              name={markupName}
              type="radio"
              className={[
                __styles.base,
                __styles.size[size],
                hidden && __styles.hidden,
                __styles.variants[type].radio_offset,
                '',
              ].join(' ')}
              checked={active}
              disabled={disabled}
              value={value ? value : markupId}
              onChange={(e) => onInputChange(e)}
              onBlur={handleBlurEvent}
            />
            {addOnBefore}
            {children || (
              <>
                <div
                  className={[
                    __styles.label.base,
                    __styles.label[size],
                    __styles.variants[type].container.align[align],
                  ].join(' ')}
                >
                  {beforeLabel && (
                    <div
                      className={[__styles.label_before.base, __styles.label_before[size]].join(
                        ' '
                      )}
                    >
                      {beforeLabel}
                    </div>
                  )}
                  <div>{label}</div>
                  {afterLabel && (
                    <div
                      className={[__styles.label_after.base, __styles.label_after[size]].join(' ')}
                    >
                      {afterLabel}
                    </div>
                  )}
                  {description && (
                    <div
                      className={[__styles.description.base, __styles.description[size]].join(' ')}
                    >
                      {description}
                    </div>
                  )}
                </div>
                {optionalLabel && (
                  <div
                    className={[__styles.optionalLabel.base, __styles.optionalLabel[size]].join(
                      ' '
                    )}
                  >
                    {optionalLabel}
                  </div>
                )}
              </>
            )}
          </label>
        )
      }}
    </RadioContext.Consumer>
  )
}

Radio.Group = RadioGroup

export default Radio
