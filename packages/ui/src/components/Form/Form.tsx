import { useReducer } from 'react'
import { useFormik, FormikConfig } from 'formik'
import { FormContextProvider } from './FormContext'

// interface Props extends FormikProps<any>, Partial FormikConfig<any> {
interface Props extends Omit<FormikConfig<any>, 'validateOnMount' | 'validateOnChange'> {
  children: any
  handleIsSubmitting?: any
  handleIsValidating?: any
  name?: string
  id?: string
  className?: string
  style?: React.CSSProperties
}

function errorReducer(state: any, action: any) {
  if (!action.error) {
    const payload = state
    delete payload[action.key]
    return payload
  }
  if (action) {
    return {
      ...state,
      [action.key]: action.error,
    }
  } else {
    throw new Error()
  }
}

export default function Form({ validate, ...props }: Props) {
  const [fieldLevelErrors, dispatchErrors] = useReducer(errorReducer, null)

  function handleFieldLevelValidation(key: any, error: string) {
    dispatchErrors({ key, error })
  }

  const formik = useFormik({
    validateOnBlur: true,
    ...props,
    validationSchema: props.validationSchema,
    initialValues: props.initialValues,
    onSubmit: props.onSubmit,
    validate:
      validate ||
      function () {
        return fieldLevelErrors
      },
  })

  // console.log('values', formik.values)
  // console.log('errors', formik.errors)
  // console.log('touched', formik.touched)

  return (
    <form
      id={props.id}
      name={props.name}
      onSubmit={formik.handleSubmit}
      className={props.className}
      style={props.style}
      method="POST"
    >
      <FormContextProvider
        values={formik.values}
        errors={formik.errors}
        formContextOnChange={formik.handleChange}
        handleBlur={formik.handleBlur}
        touched={formik.touched}
        fieldLevelValidation={handleFieldLevelValidation}
      >
        {props.children({
          /** map of field names to specific error for that field */
          errors: formik.errors, // errors,
          // /** map of field names to whether the field has been touched */
          touched: formik.touched,
          /** whether the form is currently submitting */
          isSubmitting: formik.isSubmitting,
          /** whether the form is currently validating (prior to submission) */
          isValidating: formik.isValidating,
          /** Number of times user tried to submit the form */
          submitCount: formik.submitCount,
          /** Initial values of form */
          initialValues: formik.initialValues,
          /** Current values of form */
          values: formik.values,
          /** Resets the form back to initialValues */
          handleReset: formik.handleReset,
          /** Resets the form with custom values */
          resetForm: formik.resetForm,
          /** Manually sets a fields value */
          setFieldValue: formik.setFieldValue,
        })}
      </FormContextProvider>
    </form>
  )
}
