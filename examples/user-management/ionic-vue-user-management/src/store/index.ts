import type { Claims } from '@supabase/supabase-js';
import { reactive } from 'vue';

export const store = reactive<{ user: Claims | null }>({
  user: null,
});
