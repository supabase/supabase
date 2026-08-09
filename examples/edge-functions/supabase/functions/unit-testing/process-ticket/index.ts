// supabase/functions/process-ticket/index.ts
import '@supabase/functions-js/edge-runtime.d.ts'

import { withSupabase } from '@supabase/server'

import { Database } from '../_shared/types.ts'
import { applyTicketDiscount } from './pricing.ts'

console.log('Hello from Functions!')

export type Payload = {
  price: number
}

export default {
  fetch: withSupabase<Database>({ auth: ['user'] }, async (req, ctx) => {
    const { price } = (await req.json()) as Payload
    if (!price) {
      return Response.json({ error: 'missing price field' }, { status: 400 })
    }

    const { data, error: getAgeError } = await ctx.supabase
      .from('profiles')
      .select('age')
      .limit(1)
      .single()

    if (getAgeError || !Number.isInteger(data.age)) {
      return Response.json({ error: 'could not process' }, { status: 500 })
    }

    const result = applyTicketDiscount(price, data.age)

    return Response.json({ result })
  }),
} satisfies Deno.ServeDefaultExport
