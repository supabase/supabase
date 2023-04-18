// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'std/server'

import { handler } from './handler.tsx'

console.log(`Function "opengraph" up and running!`)

serve(handler)
