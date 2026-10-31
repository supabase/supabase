import { Webhook } from 'npm:standardwebhooks@^1'
import { render } from 'npm:@react-email/render@^2'
import { withSupabase } from 'npm:@supabase/server@^1'
import React from 'npm:react@^19'
import { Resend } from 'npm:resend@^6'

import { MagicLinkEmail } from './_templates/magic-link.tsx'
import { SignUpEmail } from './_templates/sign-up.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string).replace('v1,whsec_', '')

// Called by Supabase Auth as a webhook (verified via standardwebhooks
// signature below), so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req, _ctx) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'not allowed' }, { status: 400 })
    }

    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    const wh = new Webhook(hookSecret)
    try {
      const {
        user,
        email_data: { token, token_hash, redirect_to, email_action_type },
      } = wh.verify(payload, headers) as {
        user: {
          email: string
          user_metadata: {
            username: string
            lang: string
          }
        }
        email_data: {
          token: string
          token_hash: string
          redirect_to: string
          email_action_type: string
          site_url: string
          token_new: string
          token_hash_new: string
        }
      }

      let html: string

      if (email_action_type === 'signup') {
        html = await render(
          React.createElement(SignUpEmail, {
            username: user['user_metadata'].username,
            lang: user['user_metadata'].lang,
            supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        )
      } else if (email_action_type == 'login') {
        html = await render(
          React.createElement(MagicLinkEmail, {
            supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        )
      } else {
        // TODO implement reset_password
        throw new Error('Reset Password not implemented')
      }

      const { error } = await resend.emails.send({
        from: 'welcome <onboarding@resend.dev>',
        to: [user.email],
        subject: 'Supa Custom MagicLink!',
        html,
      })
      if (error) {
        throw error
      }
    } catch (error) {
      console.log(error)
      const httpCode =
        typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
      const message = error instanceof Error ? error.message : 'Unauthorized'

      return Response.json(
        {
          error: {
            http_code: httpCode,
            message,
          },
        },
        {
          status: 401,
        }
      )
    }

    return Response.json({}, { status: 200 })
  }),
}
