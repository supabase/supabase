import { Button, Form, Input, Modal } from '@supabase/ui'
import { useStore } from 'hooks'

const RenameQuery = ({ tabId, onComplete, visible, onCancel }: any) => {
  const { ui, content: contentStore } = useStore()

  const sqlEditorStore: any = null
  const model = prepareModel()

  function prepareModel() {
    const tabInfo = sqlEditorStore.tabs.find((x: any) => x.id === tabId)
    if (tabInfo) return tabInfo.renameModel

    const favInfo = sqlEditorStore.favorites.find((x: any) => x.key === tabId)
    if (favInfo) return favInfo.renameModel
  }

  async function onRename(model: any) {
    try {
      /*
       * new main db save
       */
      await contentStore.update(
        tabId,
        {
          name: model.name,
          description: model.desc,
        },
        'sql'
      )

      /*
       * old localStorage save
       */
      sqlEditorStore.renameQuery(tabId, model)

      if (onComplete) onComplete()
      return Promise.resolve()
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to rename query: ${error.message}`,
      })
    }
  }

  return (
    <Modal visible={visible} onCancel={onCancel} hideFooter header="Rename" size="small">
      <Form
        onReset={onCancel}
        validateOnBlur
        initialValues={{
          name: model ? model.name : '',
          desc: model ? model.desc : '',
        }}
        validate={(values) => {
          const errors: any = {}
          if (!values.name) errors.name = 'Please enter a query name'
          return errors
        }}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(true)
          await onRename(values)
          setSubmitting(false)
        }}
      >
        {({ isSubmitting }: any) => (
          <div className="space-y-4 py-4">
            <Modal.Content>
              <Input label="Name" id="name" name="name" />
            </Modal.Content>
            <Modal.Content>
              <Input label="Description" id="desc" placeholder="Describe query" />
            </Modal.Content>
            <Modal.Seperator />
            <Modal.Content>
              <div className="flex items-center justify-end gap-2">
                <Button htmlType="reset" type="default" onClick={onCancel}>
                  Cancel
                </Button>
                <Button htmlType="submit" loading={isSubmitting}>
                  Rename query
                </Button>
              </div>
            </Modal.Content>
          </div>
        )}
      </Form>
    </Modal>
  )
}

export default RenameQuery
