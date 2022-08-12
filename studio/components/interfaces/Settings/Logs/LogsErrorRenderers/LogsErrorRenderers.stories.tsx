import React, { useState } from 'react'

import DefaultErrorRenderer from './DefaultErrorRenderer'
import ResourcesExceededErrorRenderer from './ResourcesExceededErrorRenderer'
import { Alert } from '@supabase/ui'

export default {
  title: 'Logs',
}

export const ErrorRenderers = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}
  >
    {[
      <DefaultErrorRenderer isCustomQuery={false} error="some string error" />,
      <DefaultErrorRenderer
        isCustomQuery={false}
        error={{
          error: { code: 123, errors: [], status: 'something', message: 'some logflare error' },
        }}
      />,
      <ResourcesExceededErrorRenderer
        isCustomQuery
        error={{
          error: {
            code: 123,
            errors: [
              { domain: 'global', message: 'Some very long message', reason: 'resourcesExceeded' },
            ],
            status: 'something',
            message: 'some logflare error',
          },
        }}
      />,

      <ResourcesExceededErrorRenderer
        isCustomQuery={false}
        error={{
          error: {
            code: 123,
            errors: [
              { domain: 'global', message: 'Some very long message', reason: 'resourcesExceeded' },
            ],
            status: 'something',
            message: 'some logflare error',
          },
        }}
      />,
    ].map((child) => (
      <Alert
        variant="danger"
        title="Sorry! An error occured when fetching data."
        withIcon
        className="w-1/2"
      >
        {child}
      </Alert>
    ))}
  </div>
)
