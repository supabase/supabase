// NOTE: For @supabase/supabase-js v2.95.0 and later, you can import CORS headers
// directly from the SDK instead of hardcoding them:
//
// import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'
//
// This ensures your CORS headers stay synchronized with any new headers added to the SDK.
// For versions before 2.95.0, use this hardcoded configuration:

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
