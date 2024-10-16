import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { ref: string } }) {
  const ref = params.ref

  const { reason } = await req.json()

  if (!ref) {
    return NextResponse.json(
      { error: 'Bad Request: Missing or invalid project reference.' },
      { status: 400 }
    )
  }

  const refPattern = /^[a-zA-Z]{20}$/
  const refIsInvalid = !refPattern.test(ref)

  if (refIsInvalid) {
    return NextResponse.json(
      { error: 'Bad Request: Missing or invalid project reference.' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(process.env.EMAIL_REPORT_SLACK_WEBHOOK as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `New report from: ${ref} \n\n ${reason}` }),
    })

    if (!response.ok) throw new Error('Failed to send to Slack')

    return NextResponse.json(
      { message: 'Thank you! We have received your report.' },
      { status: 200 }
    )
  } catch (error) {
    const errorMessage = (error as Error).message
    return NextResponse.json(
      { error: `Failure: Could not send post to Slack. Error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
