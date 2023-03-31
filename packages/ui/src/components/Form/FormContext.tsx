import React, { createContext, useContext } from 'react'

interface ContextProps {
  formContextOnChange: any
  values: any
  errors: any
  handleBlur: ((e: React.FocusEvent<any, any>) => void) | null
  touched: any
  fieldLevelValidation: any
}

interface Provider extends ContextProps {
  children?: React.ReactNode
}

// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
const FormContext = createContext<ContextProps>({
  formContextOnChange: null,
  values: null,
  errors: null,
  handleBlur: null,
  touched: null,
  fieldLevelValidation: null,
})

export const FormContextProvider = (props: Provider) => {
  const { formContextOnChange, values, errors, handleBlur, touched, fieldLevelValidation } = props

  const value = {
    formContextOnChange: formContextOnChange,
    values: values,
    errors: errors,
    handleBlur: handleBlur,
    touched: touched,
    fieldLevelValidation: fieldLevelValidation,
  }

  return <FormContext.Provider value={value}>{props.children}</FormContext.Provider>
}

// context helper to avoid using a consumer component
export const useFormContext = () => {
  const context = useContext(FormContext)
  if (context === undefined) {
    throw new Error(`useFormContextOnChange must be used within a FormContextProvider.`)
  }
  return context
}
