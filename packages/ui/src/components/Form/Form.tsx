import {
  FormikConfig,
  FormikErrors,
  FormikHelpers,
  FormikState,
  FormikTouched,
  FormikValues,
  useFormik,
} from 'formik'
import { useReducer } from 'react'
import { FormContextProvider } from './FormContext'

interface Props<T> extends Omit<FormikConfig<T>, 'validateOnMount' | 'validateOnChange'> {
  id?: string
  name?: string
  children: (props: {
    /** map of field names to specific error for that field */
    errors: FormikErrors<T>
    /** map of field names to whether the field has been touched */
    touched: FormikTouched<T>
    /** whether the form is currently submitting */
    isSubmitting: boolean
    /** whether the form is currently validating (prior to submission) */
    isValidating: boolean
    /** Number of times user tried to submit the form */
    submitCount: number
    /** Initial values of the form */
    initialValues: T
    /** Form values */
    values: T
    /** Reset form event handler  */
    handleReset: (e?: React.SyntheticEvent<any>) => void
    /** Reset form */
    resetForm: (nextState?: Partial<FormikState<T>>) => void
    /** Set value of form field directly */
    setFieldValue<K extends keyof T>(
      field: K,
      value: T[K],
      shouldValidate?: boolean
    ): Promise<void | FormikErrors<T>>
  }) => React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export type FormOnSubmitHandler<Values> = (
  values: Values,
  formikHelpers: FormikHelpers<Values>
) => void | Promise<any>

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

export default function Form<T extends FormikValues>({ validate, ...props }: Props<T>) {
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

  return (
    <form
      id={props.id}
      name={props.name}
      onSubmit={formik.handleSubmit}
      className={props.className}
      style={props.style}
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
          errors: formik.errors,
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
          setFieldValue: formik.setFieldValue as any,
        })}
      </FormContextProvider>
    </form>
  )
}
