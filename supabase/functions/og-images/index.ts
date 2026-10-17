import { withSupabase } from 'npm:@supabase/server@^1'
import { handler } from './handler.tsx'

export default {
  fetch: withSupabase({ auth: 'none' }, handler),
}

console.log('Serving og-images function')
