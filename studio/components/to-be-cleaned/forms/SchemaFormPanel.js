import SchemaForm from './SchemaForm'
import React, { useState } from 'react'
import { Button } from 'ui'

export default function SchemaFormPanel({
  schema,
  title,
  model,
  children,
  onChangeModel = (model) => {},
  onReset = () => {},
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  message = '',
}) {
  let formRef
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)
  const [hasChanged, setHasChanged] = useState(false)

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
      .catch((error) => {
        console.error('Error on submitting', error)
      })
  }

  return (
    <section className="section-block mb-8">
      <div
        className="
          flex h-12
          items-center overflow-hidden
          border-b border-panel-border-light bg-panel-header-light
          px-6 dark:border-panel-border-dark dark:bg-panel-header-dark"
      >
        <div className="flex-1 text-left">
          <h6>{title || ''}</h6>
        </div>
        <div
          className={`flex transition duration-150 ${
            hasChanged ? 'opacity-100' : 'cursor-default opacity-0'
          }`}
        >
          <Button onClick={onClickCancel} type="default" disabled={!hasChanged}>
            {cancelLabel || 'Cancel'}
          </Button>
          <Button
            onClick={onClickSubmit}
            loading={submitButtonLoading}
            disabled={!hasChanged}
            type="primary"
            className="ml-2 hover:border-green-500"
          >
            {submitLabel || 'Save'}
          </Button>
        </div>
        <span className="text-sm text-scale-900">{message}</span>
      </div>

      <div className="Form section-block--body px-6 py-3">
        <SchemaForm
          onChangeModel={(model) => {
            setHasChanged(true)
            if (onChangeModel) onChangeModel(model)
          }}
          formRef={(ref) => (formRef = ref)}
          schema={schema}
          model={model}
          children={children}
          onSubmit={async (args) => {
            onSubmit(args)
              .then(() => {
                setSubmitButtonLoading(false)
                setHasChanged(false)
              })
              .catch(() => setSubmitButtonLoading(false))
          }}
        />
      </div>
    </section>
  )
}
