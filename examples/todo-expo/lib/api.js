import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY } from './constants'
import { AsyncStorage } from '@react-native-community/async-storage'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

