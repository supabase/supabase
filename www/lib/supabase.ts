import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://obuldanrptloktxcffvn.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNzY1NjAxNSwiZXhwIjoxOTUzMjMyMDE1fQ.0sfp_Njf7l4g-nOCF5a1TQE11rPqtz8Y10uctIetkBA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase
