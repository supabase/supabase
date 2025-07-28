import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'
import { LangfuseExporter } from 'langfuse-vercel'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }

  if (!!process.env.LANGFUSE_SECRET_KEY) {
    console.log('Register langfuse')
    registerOTel({
      serviceName: 'supabase-studio',
      traceExporter: new LangfuseExporter({ debug: true }),
    })
  }
}

export const onRequestError = Sentry.captureRequestError
