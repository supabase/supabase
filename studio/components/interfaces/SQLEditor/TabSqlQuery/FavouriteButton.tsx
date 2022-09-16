import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Button, IconHeart } from '@supabase/ui'

import { useStore } from 'hooks'
import Telemetry from 'lib/telemetry'
import { useSqlStore } from 'localStores/sqlEditor/SqlEditorStore'

const FavouriteButton = () => {
  const { ui, content: contentStore } = useStore()
  const { profile: user } = ui

  const sqlEditorStore: any = useSqlStore()

  const [loading, setLoading] = useState(false)

  const id = sqlEditorStore.activeTab.id

  /*
   * `content` column json structure
   */
  let contentPayload = {
    schema_version: '1.0',
    content_id: id,
    sql: sqlEditorStore.activeTab.query,
  }

  async function addToFavorite() {
    try {
      setLoading(true)
      /*
       * remote db handling
       */
      await contentStore.updateSql(id, {
        content: {
          ...contentPayload,
          favorite: true,
        },
      })

      /*
       * old localstorage handling
       */
      const { query, name, desc } = sqlEditorStore.activeTab || {}
      sqlEditorStore.addToFavorite(id, query, name, desc)
      Telemetry.sendEvent('sql_editor', 'sql_favourited', name)

      /*
       * reload sql data in store and re-select tab
       */
      sqlEditorStore.loadTabs(sqlEditorStore.tabsFromContentStore(contentStore, user?.id), false)
      sqlEditorStore.selectTab(id)

      setLoading(false)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to add to favourites: ${error.message}`,
      })
      setLoading(false)
    }
  }

  async function unFavorite() {
    const id = sqlEditorStore.activeTab.id
    try {
      setLoading(true)
      /*
       * remote db handling
       */
      await contentStore.updateSql(id, {
        content: {
          ...contentPayload,
          favorite: false,
        },
      })

      /*
       * old localstorage handling
       */
      const { name } = sqlEditorStore.activeTab || {}
      sqlEditorStore.unFavorite(id)
      Telemetry.sendEvent('sql_editor', 'sql_unfavourited', name)

      /*
       * reload sql data in store and re-select tab
       */
      sqlEditorStore.loadTabs(sqlEditorStore.tabsFromContentStore(contentStore, user?.id), false)
      sqlEditorStore.selectTab(id)
      setLoading(false)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to remove from favourites: ${error.message}`,
      })
      setLoading(false)
    }
  }

  return (
    <>
      {sqlEditorStore.activeTab.favorite ? (
        <Button
          type="text"
          size="tiny"
          shadow={false}
          onClick={unFavorite}
          loading={loading}
          icon={<IconHeart size="tiny" fill="#48bb78" />}
        />
      ) : (
        <Button
          type="text"
          size="tiny"
          shadow={false}
          onClick={addToFavorite}
          loading={loading}
          icon={<IconHeart size="tiny" fill="gray" />}
        />
      )}
    </>
  )
}

export default observer(FavouriteButton)
