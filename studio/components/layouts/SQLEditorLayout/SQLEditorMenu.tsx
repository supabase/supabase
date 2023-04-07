import { partition } from 'lodash'
import { useState, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Menu, Input, IconSearch, IconPlus, IconX } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { useProfileQuery } from 'data/profile/profile-query'

import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import { useParams } from 'common'
import { useSnippets, useSqlEditorStateSnapshot } from 'state/sql-editor'
import { SqlSnippet, useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import QueryItem from './QueryItem'
import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useContentCreateMutation } from 'data/content/content-create-mutation'
import { useRouter } from 'next/router'

const SideBarContent = observer(() => {
  const { ui } = useStore()
  const { ref, id } = useParams()
  const router = useRouter()
  const { data: profile } = useProfileQuery()
  const [filterString, setFilterString] = useState('')

  const snap = useSqlEditorStateSnapshot()
  const { isLoading, isSuccess } = useSqlSnippetsQuery(ref, {
    onSuccess(data) {
      if (ref) snap.setRemoteSnippets(data.snippets, ref)
    },
  })
  const { mutateAsync: createContent } = useContentCreateMutation()

  const snippets = useSnippets(ref)

  const [favorites, queries] = useMemo(
    () => (snippets ? partition(snippets, (snippet) => snippet.content.favorite) : [[], []]),
    [snippets]
  )

  const favouriteTabs =
    filterString.length === 0
      ? favorites
      : favorites.filter((tab) => tab.name.toLowerCase().includes(filterString.toLowerCase()))

  const queryTabs =
    filterString.length === 0
      ? queries
      : queries.filter((tab) => tab.name.toLowerCase().includes(filterString.toLowerCase()))

  const canCreateSQLSnippet = checkPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  // [Joshen TODO] Removed optimistic query creation logic for now, need to figure out
  // how to do that after using ids as part of the URL
  const handleNewQuery = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!canCreateSQLSnippet) {
      return ui.setNotification({
        category: 'info',
        message: 'Your queries will not be saved as you do not have sufficient permissions',
      })
    }

    try {
      const payload = createSqlSnippetSkeleton({ name: 'Untitled query', owner_id: profile?.id })
      const response = await createContent(
        { projectRef: ref, payload },
        {
          onSuccess(data) {
            snap.addSnippet(data.content[0] as SqlSnippet, ref)
          },
        }
      )
      const snippetId = response.content[0].id
      router.push(`/project/${ref}/sql/${snippetId}`)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create new query: ${error.message}`,
      })
    }
  }

  return (
    <div className="mt-6">
      <Menu type="pills">
        {IS_PLATFORM && (
          <div className="my-4 mx-3 space-y-1 px-3">
            <Button
              block
              icon={<IconPlus />}
              type="default"
              disabled={isLoading}
              style={{ justifyContent: 'start' }}
              onClick={() => handleNewQuery()}
            >
              New query
            </Button>
            <Input
              size="tiny"
              icon={<IconSearch size="tiny" />}
              placeholder="Search"
              disabled={isLoading}
              onChange={(e) => setFilterString(e.target.value)}
              value={filterString}
              actions={
                filterString && (
                  <IconX
                    size={'tiny'}
                    className="mr-2 cursor-pointer"
                    onClick={() => setFilterString('')}
                  />
                )
              }
            />
          </div>
        )}
        {isLoading ? (
          <div className="px-5 my-4 space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : isSuccess ? (
          <div className="space-y-6">
            {IS_PLATFORM && (
              <div className="px-3">
                <Menu.Group title="Getting started" />
                <ProductMenuItem
                  name="Welcome"
                  isActive={id === undefined}
                  url={`/project/${ref}/sql`}
                />
              </div>
            )}
            <div className="space-y-6 px-3">
              {favouriteTabs.length >= 1 && (
                <div className="editor-product-menu">
                  <Menu.Group title="Favorites" />
                  <div className="space-y-1">
                    {favouriteTabs.map((tabInfo) => {
                      const { id } = tabInfo || {}
                      return <QueryItem key={id} tabInfo={tabInfo} />
                    })}
                  </div>
                </div>
              )}
              {queryTabs.length >= 1 && (
                <div className="editor-product-menu">
                  <Menu.Group title="SQL snippets" />
                  <div className="space-y-1">
                    {queryTabs.map((tabInfo) => {
                      const { id } = tabInfo || {}
                      return <QueryItem key={id} tabInfo={tabInfo} />
                    })}
                  </div>
                </div>
              )}
              {filterString.length > 0 && favouriteTabs.length === 0 && queryTabs.length === 0 && (
                <div className="px-4">
                  <p className="text-sm">No queries found</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div></div>
        )}
      </Menu>
    </div>
  )
})

export default SideBarContent
