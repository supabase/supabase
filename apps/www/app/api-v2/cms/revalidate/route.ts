import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, path } = body

    // Check for secret to confirm this is a valid request
    if (secret !== process.env.CMS_PREVIEW_SECRET) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    if (!path) {
      return NextResponse.json({ message: 'Missing path parameter' }, { status: 400 })
    }

    // This will revalidate the specific page
    revalidatePath(path)

    return NextResponse.json({ revalidated: true, path })
  } catch (error) {
    console.error('[Revalidate API] Error during revalidation:', error)
    return NextResponse.json(
      {
        message: 'Error revalidating',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
