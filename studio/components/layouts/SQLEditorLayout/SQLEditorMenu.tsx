import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Button,
  Dropdown,
  Typography,
  Menu,
  Input,
  IconX,
  IconPlus,
  IconEdit,
  IconSearch,
  IconTrash,
  IconChevronDown,
} from '@supabase/ui'
import Divider from 'components/ui/Divider'
import { partition } from 'lodash'

import { useStore } from 'hooks'

interface Props {
  onAddQuery?: () => void
  onRenameQuery?: (query: any) => void
  onDeleteQuery?: (query: any) => void
}

const SqlEditorMenu: FC<Props> = ({
  onAddQuery = () => {},
  onRenameQuery = () => {},
  onDeleteQuery = () => {},
}) => {
  const { ui, content } = useStore()
  const router = useRouter()
  const { queryId } = router.query

  const queries = content.sqlSnippets()
  const [favouriteQueries, savedQueries] = partition(
    queries,
    (query: any) => query.content.favorite
  )

  const page = router.pathname.split('/')[4] as undefined | 'templates'
  const projectRef = ui.selectedProject?.ref
  const [searchText, setSearchText] = useState<string>('')

  return (
    <div className="my-6 flex flex-col flex-grow">
      <div className="space-y-6">
        <div className="mx-4 space-y-1">
          <Button
            block
            icon={<IconPlus />}
            type="text"
            style={{ justifyContent: 'start' }}
            onClick={onAddQuery}
          >
            New query
          </Button>
          <Input
            layout="vertical"
            icon={<IconSearch size="tiny" />}
            className="sbui-input-no-border"
            placeholder="Search for a query"
            onChange={(e) => setSearchText(e.target.value)}
            value={searchText}
            size="tiny"
            actions={
              searchText && (
                <IconX
                  size={'tiny'}
                  className="cursor-pointer mx-1"
                  onClick={() => setSearchText('')}
                />
              )
            }
          />
        </div>

        {/* Getting started templates */}
        <div className="mx-4 flex flex-col space-y-2">
          <div className="mx-4 space-y-1">
            <Typography.Text type="secondary" small>
              Getting started
            </Typography.Text>
          </div>
          <div className="space-y-1">
            <Link href={`/project/${projectRef}/sql/templates`}>
              <div>
                <Menu.Item rounded active={page === 'templates'}>
                  <Typography.Text className="truncate" small>
                    Query Templates
                  </Typography.Text>
                </Menu.Item>
              </div>
            </Link>
          </div>
        </div>

        {/* Favourites */}
        {favouriteQueries.length > 0 && (
          <div className="mx-4 flex flex-col space-y-2">
            <div className="mx-4 space-y-1">
              <Typography.Text type="secondary" small>
                Favourites
              </Typography.Text>
            </div>
            <div className="space-y-1">
              {favouriteQueries.map((query) => {
                const id = query.id
                const isActive = queryId === id
                return (
                  <Link key={id} href={`/project/${projectRef}/sql?queryId=${id}`}>
                    <div>
                      <Menu.Item rounded active={isActive}>
                        <div className="flex justify-between">
                          <Typography.Text className="truncate" small>
                            {query.name}
                          </Typography.Text>
                          {isActive && (
                            <Dropdown
                              side="bottom"
                              align="start"
                              overlay={[
                                <Dropdown.Item
                                  key="edit-table"
                                  icon={<IconEdit size="tiny" />}
                                  onClick={() => onRenameQuery(query)}
                                >
                                  Rename query
                                </Dropdown.Item>,
                                <Divider key="divider" light />,
                                <Dropdown.Item
                                  key="delete-table"
                                  icon={<IconTrash size="tiny" />}
                                  onClick={() => onDeleteQuery(query)}
                                >
                                  Delete query
                                </Dropdown.Item>,
                              ]}
                            >
                              <Typography.Text>
                                <IconChevronDown size={16} />
                              </Typography.Text>
                            </Dropdown>
                          )}
                        </div>
                      </Menu.Item>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Saved SQL snippets */}
        <div className="mx-4 flex flex-col space-y-2">
          <div className="mx-4 space-y-1">
            <Typography.Text type="secondary" small>
              SQL snippets
            </Typography.Text>
          </div>
          <div className="space-y-1">
            {savedQueries.map((query) => {
              const id = query.id
              const isActive = queryId === id
              return (
                <Link key={id} href={`/project/${projectRef}/sql?queryId=${id}`}>
                  <div>
                    <Menu.Item rounded active={isActive}>
                      <div className="flex justify-between">
                        <Typography.Text className="truncate" small>
                          {query.name}
                        </Typography.Text>
                        {isActive && (
                          <Dropdown
                            side="bottom"
                            align="start"
                            overlay={[
                              <Dropdown.Item
                                key="edit-table"
                                icon={<IconEdit size="tiny" />}
                                onClick={() => onRenameQuery(query)}
                              >
                                Rename query
                              </Dropdown.Item>,
                              <Divider key="divider" light />,
                              <Dropdown.Item
                                key="delete-table"
                                icon={<IconTrash size="tiny" />}
                                onClick={() => onDeleteQuery(query)}
                              >
                                Delete query
                              </Dropdown.Item>,
                            ]}
                          >
                            <Typography.Text>
                              <IconChevronDown size={16} />
                            </Typography.Text>
                          </Dropdown>
                        )}
                      </div>
                    </Menu.Item>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(SqlEditorMenu)
