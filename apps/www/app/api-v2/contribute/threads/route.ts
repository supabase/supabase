import { NextRequest, NextResponse } from 'next/server'
import { getUnansweredThreads } from '~/data/contribute'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  const channel = searchParams.get('channel') ?? undefined
  const productArea = searchParams.get('product_area') ?? undefined
  const stack = searchParams.get('stack') ?? undefined
  const search = searchParams.get('search') ?? undefined

  try {
    const threads = await getUnansweredThreads(productArea, channel, stack, search, offset, 100)
    return NextResponse.json(threads)
  } catch (error) {
    console.error('Error fetching threads:', error)
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
  }
}
