import { ref, onMounted } from 'vue'
// @ts-ignore
import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  fullName: string
  username: string
  website: string
  avatarUrl: string | null
}

export function useUserProfile() {
  const supabase = createClient()
  const loading = ref(false)
  const saving = ref(false)
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)

  const profile = ref<UserProfile>({
    fullName: '',
    username: '',
    website: '',
    avatarUrl: null,
  })

  const fetchProfile = async () => {
    loading.value = true
    error.value = null
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw userError

      if (user) {
        profile.value = {
          fullName: user.user_metadata?.full_name || '',
          username: user.user_metadata?.username || '',
          website: user.user_metadata?.website || '',
          avatarUrl: user.user_metadata?.avatar_url || null,
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load profile'
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    saving.value = true
    error.value = null
    success.value = false

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('No user is currently signed in')

      const updatedMetadata = {
        full_name: updates.fullName !== undefined ? updates.fullName : profile.value.fullName,
        username: updates.username !== undefined ? updates.username : profile.value.username,
        website: updates.website !== undefined ? updates.website : profile.value.website,
        avatar_url: updates.avatarUrl !== undefined ? updates.avatarUrl : profile.value.avatarUrl,
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: updatedMetadata,
      })

      if (updateError) throw updateError

      profile.value = {
        fullName: updatedMetadata.full_name,
        username: updatedMetadata.username,
        website: updatedMetadata.website,
        avatarUrl: updatedMetadata.avatar_url,
      }
      success.value = true
    } catch (err: any) {
      error.value = err.message || 'Failed to update profile'
    } finally {
      saving.value = false
    }
  }

  const uploadAvatar = async (file: File) => {
    uploading.value = true
    error.value = null
    success.value = false

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('No user is currently signed in')

      // Validate image
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }
      // Limit size to 2MB
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Avatar image size must be less than 2MB')
      }

      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

      // Update avatarUrl local state and save to user_metadata
      await updateProfile({ avatarUrl: data.publicUrl })
    } catch (err: any) {
      error.value = err.message || 'Failed to upload avatar'
    } finally {
      uploading.value = false
    }
  }

  onMounted(() => {
    fetchProfile()
  })

  return {
    profile,
    loading,
    saving,
    uploading,
    error,
    success,
    fetchProfile,
    updateProfile,
    uploadAvatar,
  }
}
