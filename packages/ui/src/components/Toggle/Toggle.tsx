'use client'

import clsx from 'clsx'
import React, { useEffect, useState } from 'react'

import { FormLayout } from '../../lib/Layout/FormLayout/FormLayout'
import styleHandler from '../../lib/theme/styleHandler'

interface Props extends Omit<React.HTMLAttributes<HTMLButtonElement>, 'size'> {
  name?: string
  disabled?: boolean
  layout?: 'horizontal' | 'vertical' | 'flex'
  error?: string
  descriptionText?: string | React.ReactNode
  label?: string | React.ReactNode
  afterLabel?: string | React.ReactNode
  beforeLabel?: string
  labelOptional?: string
  className?: any
  defaultChecked?: boolean
  checked?: boolean
  align?: 'right' | 'left'
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  labelLayout?: 'horizontal' | 'vertical'
}

/**
 * @deprecated Use `import { Switch } from "ui"` instead
 */
function Toggle({
  disabled,
  id = '',
  name = '',
  layout = 'flex',
  error,
  descriptionText,
  label,
  afterLabel,
  beforeLabel,
  labelOptional,
  onChange,
  defaultChecked,
  checked,
  className,
  align = 'left',
  size = 'medium',
  labelLayout,
  ...props
}: Props) {
  const __styles = styleHandler('toggle')
  const [intChecked, setIntChecked] = useState((defaultChecked || checked) ?? false)

  // check if toggle checked is true or false
  // if neither true or false the toggle will rely on component state internally
  const active = checked ?? intChecked

  useEffect(() => {
    setIntChecked(active)
  }, [])

  function onClick() {
    // '`onChange` callback for this component

    // @ts-ignore // issue with conflicting input/button tag being used
    if (onChange) onChange(!active)

    setIntChecked(!intChecked)
  }

  let toggleClasses = [__styles.base, __styles.handle_container[size]]
  if (active) toggleClasses.push(__styles.active)

  let handleClasses = [__styles.handle['base'], __styles.handle[size]]
  if (active) handleClasses.push(__styles.handle_active[size])

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
      align={align}
      descriptionText={descriptionText}
      size={size}
      labelLayout={labelLayout}
      nonBoxInput
    >
      <button
        type="button"
        id={id}
        name={name}
        className={clsx(...toggleClasses, disabled && 'opacity-50 cursor-default')}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        <span aria-hidden="true" className={handleClasses.join(' ')}></span>
      </button>
    </FormLayout>
  )
}

export default Toggle
