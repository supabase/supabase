import { useState } from 'react'
import { Button } from 'ui'
import SchemaForm from './SchemaForm'

export default function SchemaFormPanel({
  schema,
  title,
  model,
  children,
  onChangeModel = () => {},
  onReset = () => {},
  onSubmit,
  loading,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  message = '',
  disabled = false,
  disabledMessage = '',
}: any) {
  let formRef: any
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)
  const [hasChanged, setHasChanged] = useState(false)
  const isLoading = loading !== undefined ? loading : submitButtonLoading

  function onClickCancel() {
    formRef.reset()
    setSubmitButtonLoading(false)
    setHasChanged(false)
    if (onReset) onReset()
  }

  const onClickSubmit = () => {
    formRef
      .submit()
      .then(() => {
        setSubmitButtonLoading(true)
      })
      .catch((error: any) => {
        console.error('Error on submitting', error)
      })
  }

  return (
    <section className="section-block mb-8">
      <div
        className="
          flex h-12
          items-center overflow-hidden
          border-b px-6
          border-overlay bg-surface-100
          "
      >
        <div className="flex-1 text-left">
          <h6>{title || ''}</h6>
        </div>
        {disabled && disabledMessage ? (
          <p className="text-sm text-foreground-light">{disabledMessage}</p>
        ) : (
          <div
            className={`flex transition duration-150 ${
              hasChanged ? 'opacity-100' : 'cursor-default opacity-0'
            }`}
          >
            <Button onClick={onClickCancel} type="default" disabled={!hasChanged || isLoading}>
              {cancelLabel || 'Cancel'}
            </Button>
            <Button
              onClick={onClickSubmit}
              loading={isLoading}
              disabled={disabled || !hasChanged || isLoading}
              type="primary"
              className="ml-2 hover:border-green-500"
            >
              {submitLabel || 'Save'}
            </Button>
          </div>
        )}
        <span className="text-sm text-foreground-lighter">{message}</span>
      </div>

      <div className="Form section-block--body px-6 py-3">
        <SchemaForm
          disabled={disabled}
          onChangeModel={(model: any) => {
            setHasChanged(true)
            if (onChangeModel) onChangeModel(model)
          }}
          formRef={(ref: any) => (formRef = ref)}
          schema={schema}
          model={model}
          onSubmit={async (args: any) => {
            onSubmit(args)
              .then(() => {
                setSubmitButtonLoading(false)
                setHasChanged(false)
              })
              .catch(() => setSubmitButtonLoading(false))
          }}
        >
          {children}
        </SchemaForm>
      </div>
    </section>
  )
}
