import SchemaForm from './SchemaForm'
import React, { useState } from 'react'
import { Button, Typography } from '@supabase/ui'

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
        console.log('Error on submitting', error)
      })
  }

  return (
    <section className="section-block mb-8">
      <div
        className="
          px-6 h-12
          bg-panel-header-light dark:bg-panel-header-dark
          border-b border-panel-border-light dark:border-panel-border-dark
          flex overflow-hidden items-center"
      >
        <div className="flex-1 text-left">
          <Typography.Title level={6}>{title || ''}</Typography.Title>
        </div>
        <div
          className={`flex transition duration-150 ${
            hasChanged ? 'opacity-100' : 'opacity-0 cursor-default'
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
