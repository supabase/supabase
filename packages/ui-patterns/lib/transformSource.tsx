import { StoryContext } from '@storybook/react'

export function transformSourceForm(code: string, StoryContext: StoryContext) {
  let _code = code
  // _code = _code.replace('<FormProvider', '<Form')
  _code = _code.replace(
    `<FormProvider
  clearErrors={() => {}}
  control={{
    _defaultValues: {
      username: ''
    },
    _executeSchema: () => {},
    _fields: {},
    _formState: {
      dirtyFields: {},
      errors: {},
      isDirty: false,
      isLoading: false,
      isSubmitSuccessful: false,
      isSubmitted: false,
      isSubmitting: false,
      isValid: false,
      isValidating: false,
      submitCount: 0,
      touchedFields: {}
    },
    _formValues: {
      username: ''
    },
    _getDirty: () => {},
    _getFieldArray: () => {},
    _getWatch: () => {},
    _names: {
      array: {},
      mount: {},
      unMount: {},
      watch: {}
    },
    _options: {
      defaultValues: {
        username: ''
      },
      mode: 'onSubmit',
      reValidateMode: 'onChange',
      resolver: () => {},
      shouldFocusError: true
    },
    _proxyFormState: {
      dirtyFields: false,
      errors: false,
      isDirty: false,
      isValid: false,
      isValidating: false,
      touchedFields: false
    },
    _removeUnmounted: () => {},
    _reset: () => {},
    _resetDefaultValues: () => {},
    _state: {
      action: false,
      mount: false,
      watch: false
    },
    _subjects: {
      array: {
        next: () => {},
        observers: [],
        subscribe: () => {},
        unsubscribe: () => {}
      },
      state: {
        next: () => {},
        observers: [],
        subscribe: () => {},
        unsubscribe: () => {}
      },
      values: {
        next: () => {},
        observers: [],
        subscribe: () => {},
        unsubscribe: () => {}
      }
    },
    _updateDisabledField: () => {},
    _updateFieldArray: () => {},
    _updateFormState: () => {},
    _updateValid: () => {},
    getFieldState: () => {},
    handleSubmit: () => {},
    register: () => {},
    setError: () => {},
    unregister: () => {}
  }}
  formState={{
    defaultValues: {
      username: ''
    }
  }}
  getFieldState={() => {}}
  getValues={() => {}}
  handleSubmit={() => {}}
  register={() => {}}
  reset={() => {}}
  resetField={() => {}}
  setError={() => {}}
  setFocus={() => {}}
  setValue={() => {}}
  trigger={() => {}}
  unregister={() => {}}
  watch={() => {}}
>`,
    `<Form_shadcn_ {...form}>`
  )
  _code = _code.replace(
    `
      control={{
        _defaultValues: {
          username: ''
        },
        _executeSchema: () => {},
        _fields: {},
        _formState: {
          dirtyFields: {},
          errors: {},
          isDirty: false,
          isLoading: false,
          isSubmitSuccessful: false,
          isSubmitted: false,
          isSubmitting: false,
          isValid: false,
          isValidating: false,
          submitCount: 0,
          touchedFields: {}
        },
        _formValues: {
          username: ''
        },
        _getDirty: () => {},
        _getFieldArray: () => {},
        _getWatch: () => {},
        _names: {
          array: {},
          mount: {},
          unMount: {},
          watch: {}
        },
        _options: {
          defaultValues: {
            username: ''
          },
          mode: 'onSubmit',
          reValidateMode: 'onChange',
          resolver: () => {},
          shouldFocusError: true
        },
        _proxyFormState: {
          defaultValues: 'all',
          dirtyFields: false,
          errors: false,
          isDirty: false,
          isValid: false,
          isValidating: false,
          touchedFields: false
        },
        _removeUnmounted: () => {},
        _reset: () => {},
        _resetDefaultValues: () => {},
        _state: {
          action: false,
          mount: false,
          watch: false
        },
        _subjects: {
          array: {
            next: () => {},
            observers: [],
            subscribe: () => {},
            unsubscribe: () => {}
          },
          state: {
            next: () => {},
            observers: [],
            subscribe: () => {},
            unsubscribe: () => {}
          },
          values: {
            next: () => {},
            observers: [],
            subscribe: () => {},
            unsubscribe: () => {}
          }
        },
        _updateDisabledField: () => {},
        _updateFieldArray: () => {},
        _updateFormState: () => {},
        _updateValid: () => {},
        getFieldState: () => {},
        handleSubmit: () => {},
        register: () => {},
        setError: () => {},
        unregister: () => {}
      }}`,
    `
      control={form.control}`
  )

  _code = _code.replace('</FormProvider>', '</Form_Shadcn_>')
  return _code
}
