import SchemaForm from '~/components/Forms/SchemaForm'
import React, { useState } from 'react'

export default function SchemaFormUnstyled({
  schema,
  model,
  children,
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel,
}) {
  let formRef
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)
  return (
    <div className="">
      <SchemaForm
        formRef={(ref) => (formRef = ref)}
        schema={schema}
        model={model}
        children={children}
        onSubmit={async (args) => {
          onSubmit(args)
            .then(() => setSubmitButtonLoading(false))
            .catch(() => setSubmitButtonLoading(false))
        }}
      />
      <button
        className="btn-secondary mr-2"
        onClick={
          onCancel ||
          (() => {
            formRef.reset()
            setSubmitButtonLoading(false)
          })
        }
      >
        {cancelLabel || 'Cancel'}
      </button>
      {submitButtonLoading ? (
        <button className="btn-primary" disabled="disabled">
          <img className="loading-spinner" src="/img/spinner.gif"></img>
        </button>
      ) : (
        <button
          className="btn-primary"
          onClick={() => {
            formRef
              .submit()
              .then((response) => {
                setSubmitButtonLoading(true)
              })
              .catch(console.error)
          }}
        >
          {submitLabel || 'Save'}
        </button>
      )}
    </div>
  )
}
