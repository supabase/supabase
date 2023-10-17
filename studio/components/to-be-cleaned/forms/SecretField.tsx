import * as React from 'react'
import { IconEye, IconEyeOff } from 'ui'
import { connectField, filterDOMProps } from 'uniforms'

const SecretField: React.FC = (props: any) => {
  const { disabled, id, inputRef, label, name, onChange, value, help, error, errorMessage } = props
  const [text, setText] = React.useState(value)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    setText(value)
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setText(newValue)
    onChange(newValue)
  }

  function onToggleVisible() {
    setVisible(!visible)
  }

  return (
    <div className="form-group" {...filterDOMProps(props)}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className="form-control flex flex-col">
        <div className="inline-flex items-center">
          <input
            disabled={disabled}
            id={id}
            name={name}
            ref={inputRef}
            value={text}
            onChange={handleChange}
            type={visible ? 'text' : 'password'}
          />
          <div className="px-2" onClick={onToggleVisible}>
            {visible ? (
              <IconEye className="text-foreground-lighter" />
            ) : (
              <IconEyeOff className="text-foreground-lighter" />
            )}
          </div>
        </div>
      </div>
      {error && <span className="form-text text-muted">{errorMessage ?? error.message}</span>}
      {help && <span className="form-text text-muted">{help}</span>}
    </div>
  )
}

export default connectField(SecretField, { kind: 'leaf' })
