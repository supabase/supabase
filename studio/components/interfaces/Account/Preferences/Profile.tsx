import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import { useProfileUpdateMutation } from 'data/profile/profile-update-mutation'
import { useStore } from 'hooks'
import { useProfile } from 'lib/profile'

const Profile = () => {
  const { ui } = useStore()
  const { profile } = useProfile()
  const { mutate: updateProfile, isLoading: isUpdating } = useProfileUpdateMutation({
    onSuccess: () => {
      ui.setNotification({ category: 'success', message: 'Successfully saved profile' })
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: "Couldn't update profile. Please try again later.",
      })
    },
  })

  const updateUser = async (model: any) => {
    updateProfile({
      firstName: model.first_name,
      lastName: model.last_name,
    })
  }

  return (
    <SchemaFormPanel
      title="Profile"
      schema={{
        type: 'object',
        required: [],
        properties: {
          first_name: { type: 'string' },
          last_name: { type: 'string' },
        },
      }}
      model={{
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
      }}
      onSubmit={updateUser}
      loading={isUpdating}
    />
  )
}

export default Profile
