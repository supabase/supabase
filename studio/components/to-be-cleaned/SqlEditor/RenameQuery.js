import React from 'react'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'
import { Button, Form, Input, Modal } from 'ui'

const RenameQuery = observer(({ tabId, onComplete, visible, onCancel }) => {
  const { ui, content: contentStore } = useStore()

  const sqlEditorStore = useSqlStore()
  const model = prepareModel()

  function prepareModel() {
    const tabInfo = sqlEditorStore.tabs.find((x) => x.id === tabId)
    if (tabInfo) return tabInfo.renameModel

    const favInfo = sqlEditorStore.favorites.find((x) => x.key === tabId)
    if (favInfo) return favInfo.renameModel
  }

  async function onRename(model) {
    try {
      /*
       * new main db save
       */
      await contentStore.update(tabId, {
        name: model.name,
        description: model.desc,
      })

      /*
       * old localStorage save
       */
      sqlEditorStore.renameQuery(tabId, model)

      if (onComplete) onComplete()
      return Promise.resolve()
    } catch (error) {
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
          const errors = {}
          if (!values.name) errors.name = 'Please enter a query name'
          return errors
        }}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(true)
          await onRename(values)
          setSubmitting(false)
        }}
      >
        {({ isSubmitting }) => (
          <div className="space-y-4 py-4">
            <Modal.Content>
              <Input label="Name" id="name" name="name" />
            </Modal.Content>
            <Modal.Content>
              <Input label="Description" id="desc" placeholder="Describe query" />
            </Modal.Content>
            <Modal.Separator />
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
})

export default RenameQuery
