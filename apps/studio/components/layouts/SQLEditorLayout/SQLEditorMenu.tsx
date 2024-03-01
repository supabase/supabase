import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconPlus,
  IconSearch,
  IconX,
  Input,
  Menu,
  Modal,
  Separator,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

import { untitledSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeleton } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { WarningIcon } from 'components/ui/Icons'
import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useContentDeleteMutation } from 'data/content/content-delete-mutation'
import { SqlSnippet, useSqlSnippetsQuery } from 'data/content/sql-snippets-query'
import { useCheckPermissions, useSelectedProject, useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useSnippets, useSqlEditorStateSnapshot } from 'state/sql-editor'
import QueryItem from './QueryItem'
import { selectItemsInRange } from './SQLEditorLayout.utils'

const SideBarContent = observer(() => {
  const { ui } = useStore()
  const { ref, id: activeId } = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()

  const [searchText, setSearchText] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedQueries, setSelectedQueries] = useState<string[]>([])

  const snap = useSqlEditorStateSnapshot()
  const { isLoading, isSuccess } = useSqlSnippetsQuery(ref, {
    refetchOnWindowFocus: false,
    staleTime: 300, // 5 minutes
    onSuccess(data) {
      if (ref) snap.setRemoteSnippets(data.snippets, ref)
    },
  })

  const { mutate: deleteContent, isLoading: isDeleting } = useContentDeleteMutation({
    onSuccess: (data) => postDeleteCleanup(data),
    onError: (error, data) => {
      if (error.code === 404 && error.message.includes('Content not found')) {
        postDeleteCleanup(data.ids)
      } else {
        toast.error(`Failed to delete queries: ${error.message}`)
      }
    },
  })

  const postDeleteCleanup = (ids: string[]) => {
    setShowDeleteModal(false)
    setSelectedQueries([])
    if (ids.length > 0) ids.forEach((id) => snap.removeSnippet(id))
    const existingSnippetIds = (snap.orders[ref!] ?? []).filter((x) => !ids.includes(x))
    if (existingSnippetIds.length === 0) {
      router.push(`/project/${ref}/sql/new`)
    } else if (ids.includes(activeId as string)) {
      router.push(`/project/${ref}/sql/${existingSnippetIds[0]}`)
    }
  }

  const snippets = useSnippets(ref)

  const projectSnippets = useMemo(() => {
    return snippets.filter((snippet) => snippet.visibility === 'project')
  }, [snippets])

  const filteredProjectSnippets = useMemo(() => {
    if (searchText.length > 0) {
      return projectSnippets.filter((tab) =>
        tab.name.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    return projectSnippets
  }, [projectSnippets, searchText])

  const personalSnippets = useMemo(() => {
    const ss = snippets.filter(
      (snippet) => snippet.visibility === 'user' && !snippet.content.favorite
    )

    if (searchText.length > 0) {
      return ss.filter((tab) => tab.name.toLowerCase().includes(searchText.toLowerCase()))
    }
    return ss
  }, [searchText, snippets])

  const favoriteSnippets = useMemo(() => {
    return snippets.filter((snippet) => snippet.content.favorite)
  }, [snippets])

  const filteredFavoriteSnippets = useMemo(() => {
    if (searchText.length > 0) {
      return favoriteSnippets.filter((tab) =>
        tab.name.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    return favoriteSnippets
  }, [favoriteSnippets, searchText])

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const onSelectQuery = (id?: string, isShiftHeld: boolean = false) => {
    if (id === undefined) return

    if (isShiftHeld) {
      const [selectedFavSnippets, selectedOtherSnippets] = partition(
        selectedQueries,
        (id) => snippets.find((x) => x.id === id)?.content.favorite
      )
      const selectedSnippet = snippets.find((x) => x.id === id)
      const isFavourite = selectedSnippet?.content.favorite

      if (isFavourite) {
        if (selectedFavSnippets.length > 0) {
          const updatedSelectedFavSnippets = selectItemsInRange(
            id,
            filteredFavoriteSnippets,
            selectedFavSnippets
          )
          setSelectedQueries(updatedSelectedFavSnippets.concat(selectedOtherSnippets))
        } else {
          selectQuery(id)
        }
      } else {
        if (selectedOtherSnippets.length > 0) {
          const updatedSelectedOtherSnippets = selectItemsInRange(
            id,
            personalSnippets,
            selectedOtherSnippets
          )
          setSelectedQueries(updatedSelectedOtherSnippets.concat(selectedFavSnippets))
        } else {
          selectQuery(id)
        }
      }
    } else {
      selectQuery(id)
    }
  }

  const selectQuery = (id: string) => {
    if (selectedQueries.includes(id)) {
      setSelectedQueries(selectedQueries.filter((x) => x !== id))
    } else {
      setSelectedQueries(selectedQueries.concat([id]))
    }
  }

  const handleNewQuery = async () => {
    if (!ref) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')
    if (!canCreateSQLSnippet) {
      return ui.setNotification({
        category: 'info',
        message: 'Your queries will not be saved as you do not have sufficient permissions',
      })
    }

    try {
      const snippet = createSqlSnippetSkeleton({
        id: uuidv4(),
        name: untitledSnippetTitle,
        owner_id: profile?.id,
        project_id: project?.id,
      })

      snap.addSnippet(snippet as SqlSnippet, ref)

      router.push(`/project/${ref}/sql/${snippet.id}`)
      setSearchText('')
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create new query: ${error.message}`,
      })
    }
  }

  const onConfirmDelete = async () => {
    if (!ref) return console.error('Project ref is required')
    deleteContent({ projectRef: ref, ids: selectedQueries })
  }

  return (
    <>
      <div className="mt-6">
        <Menu type="pills">
          {isLoading ? (
            <div className="px-5 my-4 space-y-2">
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          ) : isSuccess ? (
            <div className="space-y-6">
              <div className="px-4 flex flex-col gap-2">
                <Button
                  type="default"
                  className="justify-start"
                  onClick={() => handleNewQuery()}
                  icon={<IconPlus size="tiny" />}
                >
                  New query
                </Button>
                <Input
                  className="table-editor-search border-none"
                  icon={
                    <IconSearch className="text-foreground-lighter" size={12} strokeWidth={1.5} />
                  }
                  placeholder="Search queries"
                  onChange={(e) => setSearchText(e.target.value.trim())}
                  value={searchText}
                  size="tiny"
                  actions={
                    searchText && (
                      <Button type="text" className="px-1" onClick={() => setSearchText('')}>
                        <IconX size={12} strokeWidth={2} />
                      </Button>
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-y-6 px-2">
                {searchText.length === 0 && (
                  <div>
                    <ProductMenuItem
                      name="Templates"
                      isActive={router.asPath === `/project/${ref}/sql/templates`}
                      url={`/project/${ref}/sql/templates`}
                    />
                    <ProductMenuItem
                      name="Quickstarts"
                      isActive={router.asPath === `/project/${ref}/sql/quickstarts`}
                      url={`/project/${ref}/sql/quickstarts`}
                    />
                  </div>
                )}

                {searchText.length > 0 &&
                  filteredFavoriteSnippets.length === 0 &&
                  filteredProjectSnippets.length === 0 &&
                  personalSnippets.length === 0 && (
                    <div className="h-32 border border-dashed flex flex-col gap-y-3 items-center justify-center rounded px-3">
                      <div className="flex flex-col gap-y-1 items-center justify-center">
                        <p className="text-xs text-foreground">No queries found</p>
                        <p className="text-xs text-foreground-light text-center">
                          Your search for "{searchText}" did not return any results
                        </p>
                      </div>
                      <Button type="default" onClick={() => handleNewQuery()}>
                        New query
                      </Button>
                    </div>
                  )}

                {filteredProjectSnippets.length > 0 ? (
                  <div className="editor-product-menu">
                    <Menu.Group title="Project queries" />

                    <div className="space-y-1">
                      {filteredProjectSnippets.map((tabInfo) => {
                        const { id } = tabInfo || {}
                        return (
                          <QueryItem
                            key={id}
                            tabInfo={tabInfo}
                            hasQueriesSelected={selectedQueries.length > 0}
                          />
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                {selectedQueries.length > 0 && (
                  <>
                    <Separator />
                    <div className="px-2 flex items-center gap-x-2">
                      <Button block type="default" onClick={() => setShowDeleteModal(true)}>
                        Delete {selectedQueries.length.toLocaleString()} quer
                        {selectedQueries.length > 1 ? 'ies' : 'y'}
                      </Button>
                      <Tooltip_Shadcn_ delayDuration={100}>
                        <TooltipTrigger_Shadcn_ asChild>
                          <Button
                            type="default"
                            className="px-1"
                            icon={<IconX />}
                            onClick={() => setSelectedQueries([])}
                          />
                        </TooltipTrigger_Shadcn_>
                        <TooltipContent_Shadcn_ side="bottom" className="text-xs">
                          Clear selection
                        </TooltipContent_Shadcn_>
                      </Tooltip_Shadcn_>
                    </div>
                  </>
                )}

                {filteredFavoriteSnippets.length > 0 ? (
                  <div className="editor-product-menu">
                    <Menu.Group title="Favorites" />
                    <div className="space-y-1">
                      {filteredFavoriteSnippets.map((tabInfo) => {
                        const { id } = tabInfo || {}
                        return (
                          <QueryItem
                            key={id}
                            tabInfo={tabInfo}
                            isSelected={selectedQueries.includes(id as string)}
                            hasQueriesSelected={selectedQueries.length > 0}
                            onSelectQuery={(isShiftHeld) => onSelectQuery(id, isShiftHeld)}
                            onDeleteQuery={postDeleteCleanup}
                          />
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                {personalSnippets.length > 0 ? (
                  <div className="editor-product-menu">
                    <Menu.Group title="Your queries" />
                    <div className="space-y-1 pb-8">
                      {personalSnippets.map((tabInfo) => {
                        const { id } = tabInfo || {}
                        return (
                          <QueryItem
                            key={id}
                            tabInfo={tabInfo}
                            isSelected={selectedQueries.includes(id as string)}
                            hasQueriesSelected={selectedQueries.length > 0}
                            onSelectQuery={(isShiftHeld) => onSelectQuery(id, isShiftHeld)}
                            onDeleteQuery={postDeleteCleanup}
                          />
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div></div>
          )}
        </Menu>
      </div>
      <ConfirmationModal
        header="Confirm to delete query"
        buttonLabel="Delete query"
        buttonLoadingLabel="Deleting query"
        size="medium"
        loading={isDeleting}
        visible={showDeleteModal}
        onSelectConfirm={onConfirmDelete}
        onSelectCancel={() => setShowDeleteModal(false)}
      >
        <Modal.Content>
          <div className="my-6">
            <div className="text-sm text-foreground-light grid gap-4">
              <div className="grid gap-y-4">
                <Alert_Shadcn_ variant="destructive">
                  <WarningIcon />
                  <AlertTitle_Shadcn_>This action cannot be undone</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    The selected SQL snippets cannot be recovered once deleted
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
                <p>
                  Are you sure you want to delete the selected {selectedQueries.length} quer
                  {selectedQueries.length > 1 ? 'ies' : 'y'}?
                </p>
              </div>
            </div>
          </div>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
})

export default SideBarContent
