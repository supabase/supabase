import React, { useEffect, useState } from 'react'
import { connectField, filterDOMProps } from 'uniforms'
import { Toggle } from 'ui'

function ToggleField({
  disabled,
  id,
  inputRef,
  label,
  name,
  onChange,
  value,
  help,
  addOns,
  ...props
}) {
  const [enabled, setEnable] = useState(false)

  useEffect(() => {
    setEnable(value)
  }, [value])

  function onToggle() {
    const newValue = !enabled
    setEnable(newValue)
    onChange(newValue)
  }

  return (
    <div className="form-group items-center" {...filterDOMProps(props)}>
      <input
        disabled={disabled}
        id={id}
        name={name}
        ref={inputRef}
        type="checkbox"
        style={{ display: 'none' }}
      />

      {label && <label htmlFor={id}>{label}</label>}
      <div className="form-control flex items-center">
        <Toggle onChange={disabled ? undefined : onToggle} checked={enabled} />
        {addOns && addOns}
      </div>
      {help && <span className="form-text text-muted">{help}</span>}
    </div>
  )
}

export default connectField(ToggleField, { kind: 'leaf' })
