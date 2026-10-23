import { ref, onMounted } from 'vue'
// @ts-ignore
import { createClient } from '@/lib/supabase/client'

export function useCurrentUserImage() {
  const image = ref<string | null>(null)

  const fetchUserImage = async () => {
    const { data, error } = await createClient().auth.getSession()

    if (error) {
      console.error(error)
      return
    }

    image.value = data.session?.user.user_metadata.avatar_url ?? null
  }

  onMounted(() => {
    fetchUserImage()
  })

  return {
    image,
  }
}
