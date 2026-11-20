import { ref, onMounted } from 'vue'
// @ts-ignore
import { createClient } from '@/lib/supabase/client'

export function useCurrentUserName() {
  const name = ref<string | null>(null)

  const fetchProfileName = async () => {
    const { data, error } = await createClient().auth.getSession()

    if (error) {
      console.error(error)
      return
    }

    name.value = data.session?.user.user_metadata.full_name ?? '?'
  }

  onMounted(() => {
    fetchProfileName()
  })

  return {
    name,
  }
}
