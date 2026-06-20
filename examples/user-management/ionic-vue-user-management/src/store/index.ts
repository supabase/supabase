import type { User } from '@supabase/supabase-js'
import { reactive } from 'vue'

export const store = reactive<{ user: User | null }>({
  user: null,
})
