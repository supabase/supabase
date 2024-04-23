import React from 'react'
import { Button, Input, Modal } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

type Props = {
  onSubmit: (values: { description: string }) => Promise<void>
}

const CreateWarehouseAccessToken = (props: Props) => {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  return (
    <>
      <Button type="outline" onClick={() => setOpen(true)}>
        Create access token
      </Button>
      <Modal
        size="medium"
        onCancel={() => {
          setOpen(false)
        }}
        header="Create access token"
        visible={open}
        alignFooter="right"
        loading={loading}
      >
        <Modal.Content className="py-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              setLoading(true)

              await props.onSubmit({
                description: formData.get('description') as string,
              })

              setLoading(false)
              setOpen(false)
            }}
          >
            <FormItemLayout
              label="Description"
              description="A short description for identifying what this access token is to be used for."
              isReactForm={false}
            >
              <Input placeholder="Description" name="description" id="description" />
            </FormItemLayout>
          </form>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default CreateWarehouseAccessToken
