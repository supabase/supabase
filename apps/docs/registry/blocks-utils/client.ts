import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    'https://bxmouifhdlbpqfjplwhs.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4bW91aWZoZGxicHFmanBsd2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTEzNjk0MDEsImV4cCI6MjAyNjk0NTQwMX0.luObOkUe4SWJ-oc-qjVxLYY_f77G0h0GG4vBqlo_4rM'
  )
