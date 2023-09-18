import Link from 'next/link'
import Snippets from '../Snippets'
//import CodeSnippet from '../CodeSnippet'

export default function Authentication({ autoApiService, selectedLang, showApiKey }) {
  // [Joshen] ShowApiKey should really be a boolean, its confusing
  const defaultApiKey =
    showApiKey !== 'SUPABASE_KEY'
      ? autoApiService?.defaultApiKey ?? 'SUPABASE_CLIENT_API_KEY'
      : 'SUPABASE_CLIENT_API_KEY'
  const serviceApiKey =
    showApiKey !== 'SUPABASE_KEY'
      ? autoApiService?.serviceApiKey ?? 'SUPABASE_SERVICE_KEY'
      : 'SUPABASE_SERVICE_KEY'

  return <></>
}
