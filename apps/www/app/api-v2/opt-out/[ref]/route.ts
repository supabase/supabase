import * as Sentry from '@sentry/nextjs'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_EMAIL_ABUSE_URL as string
const supabaseServiceKey = process.env.EMAIL_ABUSE_SERVICE_KEY as string
const hcaptchaSecret = process.env.HCAPTCHA_SECRET_KEY as string

// Function to verify hCaptcha token
async function verifyCaptcha(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: hcaptchaSecret,
        response: token,
      }),
    })

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Error verifying captcha:', error)
    return false
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ ref: string }> }) {
  const params = await props.params
  const ref = params.ref
  const { reason, email, captchaToken } = await req.json()

  // Validate reason
  const allowedReasons = ['phishing', 'advertisement', 'malware', 'scam', 'other']
  if (!allowedReasons.includes(reason)) {
    return NextResponse.json({ error: 'Bad Request: Invalid reason provided.' }, { status: 400 })
  }

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

  // Verify captcha token
  if (!captchaToken) {
    return NextResponse.json(
      { error: 'Bad Request: Missing captcha verification.' },
      { status: 400 }
    )
  }

  const isValidCaptcha = await verifyCaptcha(captchaToken)
  if (!isValidCaptcha) {
    return NextResponse.json(
      { error: 'Bad Request: Invalid captcha verification.' },
      { status: 400 }
    )
  }

  try {
    const { error: supabaseError } = await supabase
      .from('manual_reports')
      .insert([{ project_ref: ref, reason, email }])

    if (supabaseError) {
      throw new Error(`Supabase error: ${supabaseError.message}`)
    }

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
    Sentry.captureException(error)
    const errorMessage = (error as Error).message
    return NextResponse.json(
      { error: `Failure: Could not send post to Slack. Error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
