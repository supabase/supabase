import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Button, IconHeart } from 'ui'

import * as Tooltip from '@radix-ui/react-tooltip'
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

  const isFavorite = sqlEditorStore.activeTab.favorite

  return (
    <>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Content side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-scale-100 py-1 px-2 leading-none shadow',
              'border border-scale-200',
            ].join(' ')}
          >
            <span className="text-xs text-scale-1200">
              {isFavorite ? 'Remove' : 'Add'} this query {isFavorite ? 'from' : 'to'} your
              Favourites
            </span>
          </div>
        </Tooltip.Content>
        <Tooltip.Trigger type="button">
          <Button
            type="text"
            size="tiny"
            shadow={false}
            onClick={isFavorite ? unFavorite : addToFavorite}
            loading={loading}
            icon={<IconHeart size="tiny" fill={isFavorite ? '#48bb78' : 'gray'} />}
          />
        </Tooltip.Trigger>
      </Tooltip.Root>
    </>
  )
}

export default observer(FavouriteButton)
