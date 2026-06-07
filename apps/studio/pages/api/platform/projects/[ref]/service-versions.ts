import { bff } from '@/lib/console-bff'

// [console fork] Service versions for the self-hosting stack. Static for shared infra.
export default bff({
  GET: async (_req, res) =>
    res.status(200).json({
      'supabase-postgres': '15.8.1.060',
      gotrue: 'v2.177.0',
      postgrest: 'v12.2.12',
    }),
})
