import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import {
  Copy,
  Mail,
  RefreshCw,
  Search,
  ShieldOffIcon,
  Trash,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react'
import { UIEvent, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import APIDocsButton from 'components/ui/APIDocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useUserDeleteMFAFactorsMutation } from 'data/auth/user-delete-mfa-factors-mutation'
import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { useUserResetPasswordMutation } from 'data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from 'data/auth/user-send-magic-link-mutation'
import { useUserSendOTPMutation } from 'data/auth/user-send-otp-mutation'
import { useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import type { User } from 'data/auth/users-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { copyToClipboard, timeout } from 'lib/helpers'
import {
  Button,
  cn,
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import AddUserDropdown from './AddUserDropdown'
import { formatUsersData, isAtBottom } from './Users.utils'
import UsersSidePanel from './UserSidePanel'
import { formatClipboardValue } from 'components/grid/utils/common'

type Filter = 'all' | 'verified' | 'unverified' | 'anonymous'
const USERS_TABLE_COLUMNS = [
  { id: 'img', name: '', minWidth: 65, width: 65, resizable: false },
  { id: 'id', name: 'UID', minWidth: undefined, width: 280, resizable: true },
  { id: 'name', name: 'Display name', minWidth: 0, width: 150, resizable: false },
  {
    id: 'email',
    name: 'Email',
    minWidth: undefined,
    width: 300,
    resizable: true,
  },
  { id: 'provider', name: 'Provider', minWidth: 150, resizable: true },
  { id: 'provider_type', name: 'Provider type', minWidth: 150, resizable: true },
  { id: 'phone', name: 'Phone', minWidth: undefined, resizable: true },
  {
    id: 'created_at',
    name: 'Created at',
    minWidth: undefined,
    width: 260,
    resizable: true,
  },
  {
    id: 'last_sign_in_at',
    name: 'Last sign in at',
    minWidth: undefined,
    width: 260,
    resizable: true,
  },
]

// [Joshen] Just naming it as V2 as its a rewrite of the old one, to make it easier for reviews
// Can change it to remove V2 thereafter
export const UsersV2 = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const gridRef = useRef<DataGridHandle>(null)
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [filterKeywords, setFilterKeywords] = useState('')
  const [selectedRow, setSelectedRow] = useState<number>()

  const [toastId, setToastId] = useState<string | number>()
  const [selectedUser, setSelectedUser] = useState<User>()
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleteFactorsModalOpen, setIsDeleteFactorsModalOpen] = useState(false)

  const canSendMagicLink = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'send_magic_link')
  const canSendRecovery = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'send_recovery')
  const canSendOtp = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'send_otp')
  const canRemoveUser = useCheckPermissions(PermissionAction.TENANT_SQL_DELETE, 'auth.users')
  const canRemoveMFAFactors = useCheckPermissions(
    PermissionAction.TENANT_SQL_DELETE,
    'auth.mfa_factors'
  )

  const {
    data,
    error,
    isLoading,
    isRefetching,
    isError,
    // hasNextPage,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
  } = useUsersInfiniteQuery(
    {
      projectRef,
      keywords: filterKeywords,
      filter: filter === 'all' ? undefined : filter,
    },
    {
      keepPreviousData: Boolean(filterKeywords),
    }
  )

  const totalUsers = useMemo(() => data?.pages[0].total, [data?.pages[0].total])
  const users = useMemo(() => data?.pages.flatMap((page) => page.users), [data?.pages])

  const { mutate: resetPassword } = useUserResetPasswordMutation({
    onSuccess: (_, vars) => {
      toast.success(`Sent password recovery to ${vars.user.email}`, { id: toastId })
    },
    onError: (err) => {
      toast.error(`Failed to send password recovery: ${err.message}`, { id: toastId })
    },
  })
  const { mutate: sendMagicLink } = useUserSendMagicLinkMutation({
    onSuccess: (_, vars) => {
      toast.success(`Sent magic link to ${vars.user.email}`)
    },
    onError: (err) => {
      toast.error(`Failed to send magic link: ${err.message}`, { id: toastId })
    },
  })
  const { mutate: sendOTP } = useUserSendOTPMutation({
    onSuccess: (_, vars) => {
      toast.success(`Sent OTP to ${vars.user.phone}`)
    },
    onError: (err) => {
      toast.error(`Failed to send OTP: ${err.message}`, { id: toastId })
    },
  })
  const { mutate: deleteUser } = useUserDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${selectedUser?.email}`)
      setIsDeleteModalOpen(false)
    },
  })
  const { mutate: deleteUserMFAFactors } = useUserDeleteMFAFactorsMutation({
    onSuccess: () => {
      toast.success("Successfully deleted the user's factors")
      setIsDeleteFactorsModalOpen(false)
    },
  })

  const usersTableColumns = USERS_TABLE_COLUMNS.map((col) => {
    const res: Column<any> = {
      key: col.id,
      name: col.name,
      resizable: col.resizable,
      sortable: false,
      width: col.width,
      minWidth: col.minWidth ?? 120,
      renderHeaderCell: () => {
        if (col.id === 'img') return undefined
        return (
          <div className="flex items-center justify-between font-normal text-xs w-full">
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">{col.name}</p>
            </div>
          </div>
        )
      },
      renderCell: ({ row }) => {
        const value = row?.[col.id]
        const user = users?.find((u) => u.id === row.id)
        const formattedValue =
          value !== null && ['created_at', 'last_sign_in_at'].includes(col.id)
            ? dayjs(value).format('ddd DD MMM YYYY HH:mm:ss [GMT]ZZ')
            : value
        const isConfirmed = user?.email_confirmed_at || user?.phone_confirmed_at

        if (col.id === 'img') {
          return (
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full bg-center bg-cover bg-no-repeat',
                  !row.img ? 'bg-selection' : 'border'
                )}
                style={{ backgroundImage: row.img ? `url('${row.img}')` : 'none' }}
              >
                {!row.img && <UserIcon size={12} />}
              </div>
            </div>
          )
        }

        return (
          <ContextMenu_Shadcn_ modal={false}>
            <ContextMenuTrigger_Shadcn_ asChild>
              <div
                className={cn(
                  'w-full flex items-center text-xs gap-x-2',
                  col.id.includes('provider') ? 'capitalize' : ''
                )}
              >
                {col.id === 'provider' && row.provider_icon && (
                  <img width={16} src={row.provider_icon} alt={`${row.provider} auth icon`} />
                )}
                {col.id === 'last_sign_in_at' && !isConfirmed ? (
                  <p className="text-foreground-lighter">Waiting for verification</p>
                ) : (
                  <p>{formattedValue === null ? '-' : formattedValue}</p>
                )}
              </div>
            </ContextMenuTrigger_Shadcn_>
            <ContextMenuContent_Shadcn_ onCloseAutoFocus={(e) => e.stopPropagation()}>
              <ContextMenuItem_Shadcn_
                className="gap-x-2"
                onSelect={() => {
                  const valueToCopy = formatClipboardValue(value)
                  copyToClipboard(valueToCopy)
                }}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Copy size={14} />
                Copy {col.id === 'id' ? col.name : col.name.toLowerCase()}
              </ContextMenuItem_Shadcn_>
              <ContextMenuItem_Shadcn_
                className="gap-x-2"
                onSelect={() => {
                  setSelectedUser(user)
                  setIsUserDetailsOpen(true)
                }}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <UserIcon size={14} />
                View user info
              </ContextMenuItem_Shadcn_>
              {row.email !== null && (
                <>
                  <ContextMenuSeparator_Shadcn_ />
                  <ContextMenuItem_Shadcn_
                    className="gap-x-2"
                    disabled={!canSendRecovery}
                    onSelect={() => {
                      if (user) handleResetPassword(user)
                    }}
                    onFocusCapture={(e) => e.stopPropagation()}
                  >
                    <Mail size={14} />
                    Send password recovery
                  </ContextMenuItem_Shadcn_>
                  <ContextMenuItem_Shadcn_
                    className="gap-x-2"
                    disabled={!canSendMagicLink}
                    onSelect={() => {
                      if (user) handleSendMagicLink(user)
                    }}
                    onFocusCapture={(e) => e.stopPropagation()}
                  >
                    <Mail size={14} />
                    Send magic link
                  </ContextMenuItem_Shadcn_>
                </>
              )}
              {row.phone !== null && (
                <>
                  <ContextMenuSeparator_Shadcn_ />
                  <ContextMenuItem_Shadcn_
                    className="gap-x-2"
                    disabled={!canSendOtp}
                    onSelect={() => {
                      if (user) handleSendOtp(user)
                    }}
                    onFocusCapture={(e) => e.stopPropagation()}
                  >
                    <Mail size={14} />
                    Send OTP
                  </ContextMenuItem_Shadcn_>
                </>
              )}
              <ContextMenuSeparator_Shadcn_ />
              <ContextMenuItem_Shadcn_
                className="gap-x-2"
                disabled={!canRemoveMFAFactors}
                onSelect={() => {
                  setSelectedUser(user)
                  setIsDeleteFactorsModalOpen(true)
                }}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <ShieldOffIcon size={14} />
                Remove MFA factors
              </ContextMenuItem_Shadcn_>
              <ContextMenuItem_Shadcn_
                className="gap-x-2"
                disabled={!canRemoveUser}
                onSelect={() => {
                  setSelectedUser(user)
                  setIsDeleteModalOpen(true)
                }}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Trash size={14} />
                Delete user
              </ContextMenuItem_Shadcn_>
            </ContextMenuContent_Shadcn_>
          </ContextMenu_Shadcn_>
        )
      },
    }
    return res
  })

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (isLoading || !isAtBottom(event)) return
    fetchNextPage()
  }

  const clearSearch = () => {
    setSearch('')
    setFilterKeywords('')
  }

  const handleResetPassword = async (user: User) => {
    if (!projectRef) return console.error('Project ref is required')
    const id = toast.loading(`Sending password recovery to ${user.email}`)
    setToastId(id)
    resetPassword({ projectRef, user })
  }

  async function handleSendMagicLink(user: User) {
    if (!projectRef) return console.error('Project ref is required')
    sendMagicLink({ projectRef, user })
  }

  async function handleSendOtp(user: User) {
    if (!projectRef) return console.error('Project ref is required')
    sendOTP({ projectRef, user })
  }

  async function handleDelete() {
    await timeout(200)
    if (!projectRef) return console.error('Project ref is required')
    if (!selectedUser) return console.error('No user is selected')
    deleteUser({ projectRef, user: selectedUser })
  }

  async function handleDeleteFactors() {
    await timeout(200)
    if (!projectRef) return console.error('Project ref is required')
    if (!selectedUser) return console.error('No user is selected')
    deleteUserMFAFactors({ projectRef, userId: selectedUser.id as string })
  }

  return (
    <>
      <div className="h-full flex flex-col">
        <FormHeader className="py-4 px-6 !mb-0" title="Users" />
        <div className="bg-surface-200 py-3 px-6 flex items-center justify-between border-t">
          <div className="flex items-center gap-x-2">
            <Input
              size="tiny"
              className="w-64"
              icon={<Search size={14} className="text-foreground-lighter" />}
              placeholder="Search by email, phone number or UID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.code === 'Enter' && search.length > 0) setFilterKeywords(search)
              }}
              actions={[
                search && (
                  <Button size="tiny" type="text" icon={<X />} onClick={() => clearSearch()} />
                ),
              ]}
            />
            <Select_Shadcn_ value={filter} onValueChange={(val) => setFilter(val as Filter)}>
              <SelectTrigger_Shadcn_ size="tiny" className="w-[150px]">
                <SelectValue_Shadcn_ />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectGroup_Shadcn_>
                  <SelectItem_Shadcn_ value="all">All users</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="verified">Verified users</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="unverified">Unverified users</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="anonymous">Anonymous users</SelectItem_Shadcn_>
                </SelectGroup_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <div className="flex items-center gap-2">
            {isNewAPIDocsEnabled && <APIDocsButton section={['user-management']} />}
            <Button
              size="tiny"
              icon={<RefreshCw />}
              type="default"
              loading={isRefetching && !isFetchingNextPage}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
            <AddUserDropdown projectKpsVersion={project?.kpsVersion} />
          </div>
        </div>
        <div className="flex flex-col w-full h-full">
          <DataGrid
            ref={gridRef}
            className="flex-grow"
            rowHeight={44}
            headerRowHeight={36}
            columns={usersTableColumns}
            rows={formatUsersData(users ?? [])}
            rowClass={(_, idx) => {
              const isSelected = idx === selectedRow
              return [
                `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
                '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                '[&>.rdg-cell:first-child>div]:ml-4',
              ].join(' ')
            }}
            onScroll={handleScroll}
            renderers={{
              renderRow(idx, props) {
                return (
                  <Row
                    {...props}
                    key={props.row.id}
                    onClick={() => {
                      if (typeof idx === 'number' && idx >= 0) {
                        setSelectedRow(idx)
                        gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                      }
                    }}
                  />
                )
              },
              noRowsFallback: isLoading ? (
                <div className="absolute top-14 px-6 w-full">
                  <GenericSkeletonLoader />
                </div>
              ) : isError ? (
                <div className="absolute top-14 px-6 flex flex-col items-center justify-center w-full">
                  <AlertError subject="Failed to retrieve users" error={error} />
                </div>
              ) : (
                <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
                  <Users className="text-foreground-lighter" strokeWidth={1} />
                  <div className="text-center">
                    <p className="text-foreground">
                      {filter !== 'all' || filterKeywords.length > 0
                        ? 'No users found'
                        : 'No users in your project'}
                    </p>
                    <p className="text-foreground-light">
                      {filter !== 'all' || filterKeywords.length > 0
                        ? 'There are currently no users based on the filters applied'
                        : 'There are currently no users who signed up to your project'}
                    </p>
                  </div>
                </div>
              ),
            }}
          />
        </div>
        <div className="flex min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light">
          Total: {totalUsers} users
        </div>
      </div>

      <UsersSidePanel
        selectedUser={selectedUser}
        userSidePanelOpen={isUserDetailsOpen}
        setUserSidePanelOpen={() => {
          setSelectedUser(undefined)
          setIsUserDetailsOpen(false)
        }}
      />

      <ConfirmationModal
        visible={isDeleteModalOpen}
        title="Confirm to delete"
        confirmLabel="Delete"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleDelete()
        }}
      >
        <p className="text-sm text-foreground-light">
          This is permanent! Are you sure you want to delete user {selectedUser?.email}?
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        visible={isDeleteFactorsModalOpen}
        title="Confirm to delete"
        confirmLabel="Delete"
        onCancel={() => setIsDeleteFactorsModalOpen(false)}
        onConfirm={() => {
          handleDeleteFactors()
        }}
      >
        <p className="text-sm text-foreground-light">
          This is permanent! Are you sure you want to delete the user's MFA factors?
        </p>
      </ConfirmationModal>
    </>
  )
}
