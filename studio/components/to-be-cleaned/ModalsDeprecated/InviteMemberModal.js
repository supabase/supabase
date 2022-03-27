import { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { debounce, isNil } from 'lodash'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { post } from 'lib/common/fetch'
import { Button, IconKey, IconLoader, IconUser, IconX, Input, Typography } from '@supabase/ui'
import { Modal } from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { Transition } from '@headlessui/react'
import { useOrganizationDetail, useStore } from 'hooks'

/**
 * Modal to invite member to Organization
 *
 * @param {Object}          organization        // organization detail
 * @param {Array}           members             // organization members list
 */

const PageContext = createContext(null)
function InviteMemberModal({ organization, members = [] }) {
  const PageState = useLocalObservable(() => ({
    members: [],
    keywords: '',
    profiles: null,
    selectedProfile: null,
    addMemberLoading: false,
    get addBtnText() {
      if (this.selectedProfile) return `Add ${this.selectedProfile.username} to organization`
      return 'Select a member above'
    },
    get addBtnDisable() {
      return !this.selectedProfile || this.addMemberLoading
    },
    setProfiles(profiles) {
      let temp = profiles
      if (profiles) {
        temp = profiles
          .map((profile) => {
            const foundMember = this.members.find((x) => x.profile.id == profile.id)
            return { ...profile, isMember: foundMember !== undefined }
          })
          .sort((a, b) => a.username.localeCompare(b.username))
      }
      this.profiles = temp
    },
  }))
  const { ui } = useStore()
  const { mutateOrgMembers } = useOrganizationDetail(ui.selectedOrganization?.slug || '')
  const [isOpen, setIsOpen] = useState(false)
  const { id: orgId, slug: orgSlug } = organization

  useEffect(() => {
    PageState.members = members
  }, [members])

  function toggle() {
    // reset data before showing modal again
    if (!isOpen) {
      PageState.keywords = ''
      PageState.selectedProfile = null
      PageState.profiles = null
      PageState.addMemberLoading = false
    }
    setIsOpen(!isOpen)
  }

  async function addMember() {
    PageState.addMemberLoading = true
    const response = await post(`${API_URL}/organizations/${orgSlug}/members/add`, {
      org_id: orgId,
      user_id: PageState.selectedProfile.id,
    })
    if (isNil(response)) {
      ui.setNotification({ category: 'error', message: 'Failed to add member' })
    } else if (response?.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to add member: ${response.error.message}`,
      })
      PageState.addMemberLoading = false
    } else {
      const newMember = response
      mutateOrgMembers([...PageState.members, newMember], false)
      toggle()
      ui.setNotification({ category: 'success', message: 'Successfully added new member' })
    }
  }

  return (
    <PageContext.Provider value={PageState}>
      <Button onClick={toggle}>Invite</Button>
      <Modal
        size="small"
        className="!overflow-visible"
        icon={<IconKey size="xlarge" background="brand" />}
        visible={isOpen}
        onCancel={toggle}
        header="Invite a member to organization"
        description="Members you'd like to invite must already be registered on Supabase"
        layout="vertical"
        hideFooter
      >
        <div className="w-full py-4 space-y-4">
          <Modal.Content>
            <div className="text-center">
              <InputSearchWithResults className="" />
            </div>
          </Modal.Content>
          <Modal.Seperator />
          <Modal.Content>
            <div className="">
              <Button
                onClick={addMember}
                loading={PageState.addMemberLoading}
                disabled={PageState.addBtnDisable}
                block
              >
                {PageState.addBtnText}
              </Button>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </PageContext.Provider>
  )
}
export default observer(InviteMemberModal)

const InputSearchWithResults = observer(({ className }) => {
  const PageState = useContext(PageContext)
  const { ui } = useStore()
  const [loading, setLoading] = useState(false)
  const debounceSearchProfile = useCallback(debounce(searchProfile, 500), [PageState.keywords])

  useEffect(() => {
    debounceSearchProfile()
    // Cancel the debounce on useEffect cleanup.
    return debounceSearchProfile.cancel
  }, [PageState.keywords, debounceSearchProfile])

  async function searchProfile() {
    if (PageState.keywords.length === 0) {
      PageState.setProfiles(null)
      return
    }
    setLoading(true)
    const response = await post(`${API_URL}/profile/search`, { keywords: PageState.keywords })
    if (isNil(response)) {
      ui.setNotification({ category: 'error', message: 'Failed to search profile' })
    } else if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to search profile: ${response.error.message}`,
      })
      setLoading(false)
    } else {
      PageState.setProfiles(response)
      setLoading(false)
    }
  }

  function onInputChange(e) {
    PageState.keywords = e.target.value
  }

  function reset() {
    PageState.keywords = ''
    PageState.setProfiles(null)
    PageState.selectedProfile = null
  }

  if (PageState.selectedProfile) {
    const fullName = `${PageState.selectedProfile.first_name || ''} ${
      PageState.selectedProfile.last_name || ''
    }`
    return (
      <div className={className}>
        <div className="flex px-6 py-2 items-center rounded bg-scale-400 border">
          <div className="flex-grow text-left">
            <p className="text-scale-1200 font-medium">{PageState.selectedProfile.username}</p>
            <p className="text-sm leading-5 text-scale-1100">
              {fullName !== ' ' ? `${fullName} • Invite collaborator` : 'Invite collaborator'}
            </p>
          </div>
          <button className="text-scale-900 hover:text-scale-1200">
            <IconX strokeWidth={2} onClick={reset} />
          </button>
        </div>
      </div>
    )
  }

  const onSelectDropdownOption = (e, option) => {
    if (!option.isMember) PageState.selectedProfile = option
  }

  return (
    <div className={className}>
      <div className="relative rounded-md shadow-sm">
        <Input
          icon={<IconUser />}
          autoFocus
          id="email"
          type="text"
          className="form-input"
          onChange={onInputChange}
          autoComplete="off"
          value={PageState.keywords}
          placeholder="search by username or email"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {loading && <IconLoader className="animate-spin" size={16} />}
        </div>
      </div>
      {PageState.profiles && PageState.profiles.length !== 0 ? (
        <>
          <div className="flex flex-col gap-1 py-4">
            {PageState.profiles.map((profile, i) => {
              const { first_name, last_name, username, isMember } = profile
              const fullName = `${first_name || ''} ${last_name || ''}`
              let subText = isMember ? 'Already in this organization' : 'Invite collaborator'
              if (fullName !== ' ') subText = `${fullName} • ${subText}`
              return (
                <Button
                  block
                  key={`option_${i}`}
                  className={`px-3 py-1 ${
                    isMember
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark'
                  } first:rounded-t-md last:rounded-b-md`}
                  onClick={(e) => onSelectDropdownOption(e, profile)}
                  type="default"
                  style={{ justifyContent: 'flex-start' }}
                  size="medium"
                >
                  <div className="flex items-center gap-2">
                    <span className="block truncate">{username}</span>
                    <span className="text-scale-900 block truncate" type="secondary">
                      {subText}
                    </span>
                  </div>
                </Button>
              )
            })}
          </div>
        </>
      ) : PageState.profiles &&
        PageState.profiles.length === 0 &&
        !loading &&
        PageState.keywords ? (
        <>
          <p className="text-sm text-scale-1200 mt-4">Could not find account.</p>
          <p className="text-sm text-scale-1100">Has the user already signed up?</p>
        </>
      ) : null}
    </div>
  )
})

const ProfileDropdown = observer(({ className }) => {
  const PageState = useContext(PageContext)

  const onSelectDropdownOption = (e, option) => {
    if (!option.isMember) PageState.selectedProfile = option
  }

  if (!PageState.profiles) return null
  return (
    <div className={className}>
      <Transition
        show={!PageState.selectedProfile}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="origin-top-right w-full max-h-48 rounded-md shadow-lg overflow-y-auto z-100 fixed">
          <div className="rounded-md bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 text-left">
            <div
              className="py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="options-menu"
            >
              {PageState.profiles.length === 0 && (
                <div className="px-3 py-2">
                  <p className="text-base leading-6 font-medium">
                    Could not find account. Has the user already signed up?
                  </p>
                </div>
              )}
              {PageState.profiles.map((profile, i) => {
                const { first_name, last_name, username, isMember } = profile
                const fullName = `${first_name || ''} ${last_name || ''}`
                let subText = isMember ? 'Already in this organization' : 'Invite collaborator'
                if (fullName !== ' ') subText = `${fullName} • ${subText}`
                return (
                  <div
                    key={`option_${i}`}
                    className={`px-3 py-1 ${
                      isMember
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:bg-bg-alt-light dark:hover:bg-bg-alt-dark'
                    } first:rounded-t-md last:rounded-b-md`}
                    onClick={(e) => onSelectDropdownOption(e, profile)}
                  >
                    <Typography.Text className="block">{username}</Typography.Text>
                    <Typography.Text className="block" type="secondary">
                      {subText}
                    </Typography.Text>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Transition>
    </div>
  )
})
