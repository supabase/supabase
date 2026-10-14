import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

async function signOutAndRedirect(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/community-docs'
  return NextResponse.redirect(new URL(`${basePath}/`, request.url))
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request)
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request)
}
