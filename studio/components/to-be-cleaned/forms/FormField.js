import React, { forwardRef } from 'react'

const FormField = forwardRef(
  (
    {
      id,
      label,
      type,
      description,
      placeholder,
      errorMessage,
      wrapperClasses,
      children,
      value,
      onChange,
      checked,
      choices,
      autoFocus,
    },
    ref
  ) => {
    let options =
      type === 'select'
        ? Object.keys(choices).map((choice) => {
            return (
              <option key={choices[choice]} value={choices[choice]}>
                {choices[choice]}
              </option>
            )
          })
        : null

    return (
      <div className={`form-group ${wrapperClasses ? wrapperClasses : ''}`}>
        <label htmlFor={id}>{label}</label>
        {children ? (
          <div className="form-control inline-block p-3">{children}</div>
        ) : type === 'select' ? (
          <select id={id} onChange={onChange} defaultValue={value} className="form-control">
            {options}
          </select>
        ) : (
          <input
            id={id}
            name={id}
            className="form-control text-base"
            ref={ref}
            type={type}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            checked={checked}
            autoFocus={autoFocus}
          />
        )}
        {errorMessage && errorMessage != '' && <p className="form-error">{errorMessage}</p>}
        {description && <div className="form-text form-help">{description}</div>}
      </div>
    )
  }
)

export default FormField
