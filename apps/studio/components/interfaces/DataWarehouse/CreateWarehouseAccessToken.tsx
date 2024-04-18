import React from 'react'
import { Button, Input, Modal } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

type Props = {}

const CreateWarehouseAccessToken = (props: Props) => {
  const [open, setOpen] = React.useState(false)

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
        onConfirm={() => {
          setOpen(false)
        }}
      >
        <Modal.Content>
          <form>
            <FormItemLayout
              label="Description"
              description="A short description for identifying what this access token is to be used for."
              isReactForm={false}
            >
              <Input placeholder="Description" />
            </FormItemLayout>
          </form>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default CreateWarehouseAccessToken
