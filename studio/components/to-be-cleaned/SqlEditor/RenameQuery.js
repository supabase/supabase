import React from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { AutoField } from 'uniforms-bootstrap4'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'

import { useStore } from 'hooks'
import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'
import { useProjectContentStore } from 'stores/projectContentStore'

const RenameQuery = observer(({ tabId, onComplete }) => {
  const { ui } = useStore()

  const router = useRouter()
  const { ref } = router.query

  const contentStore = useProjectContentStore(ref)
  const sqlEditorStore = useSqlStore()
  const model = prepareModel()

  function prepareModel() {
    const tabInfo = sqlEditorStore.tabs.find((x) => x.id == tabId)
    if (tabInfo) return tabInfo.renameModel
    const favInfo = sqlEditorStore.favorites.find((x) => x.key == tabId)
    if (favInfo) return favInfo.renameModel
  }

  async function onRename(model) {
    try {
      /*
       * old localStorage save
       */
      sqlEditorStore.renameQuery(tabId, model)
      /*
       * new main db save
       */
      await contentStore.update(tabId, {
        name: model.name,
        description: model.desc,
      })
      await contentStore.load()
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

  function onCancel() {
    if (onComplete) onComplete()
  }

  return (
    <SchemaFormPanel
      title="Rename"
      schema={{
        properties: {
          name: { title: 'Name', type: 'string' },
          desc: { title: 'Description', type: 'string' },
        },
        required: ['name'],
        type: 'object',
      }}
      model={model}
      onSubmit={onRename}
      onReset={onCancel}
    >
      <AutoField
        name="name"
        inputRef={(x) => x?.focus()}
        showInlineError
        errorMessage="Please enter a query name"
      />
      <AutoField name="desc" placeholder="Describe query" />
    </SchemaFormPanel>
  )
})

export default RenameQuery
