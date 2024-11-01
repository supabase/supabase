import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_EMAIL_ABUSE_URL as string
const supabaseServiceKey = process.env.EMAIL_ABUSE_SERVICE_KEY as string

export async function POST(req: NextRequest, { params }: { params: { ref: string } }) {
  const ref = params.ref
  const { reason, email } = await req.json()

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    const { error: supabaseError } = await supabase
      .from('manual_reports')
      .insert([{ project_ref: ref, reason, email }])

    if (supabaseError) throw new Error(`Supabase error: ${supabaseError.message}`)

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
