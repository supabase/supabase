// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

import { handler } from './handler.tsx'

console.log(`Function "lw7-ticket-gallery" up and running!`)

serve(handler)
