import React, { useState } from 'react'

import DefaultErrorRenderer from './DefaultErrorRenderer'
import ResourcesExceededErrorRenderer from './ResourcesExceededErrorRenderer'
import { Alert } from 'ui'

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
      <DefaultErrorRenderer key="one" isCustomQuery={false} error="some string error" />,
      <DefaultErrorRenderer
        key="two"
        isCustomQuery={false}
        error={{
          error: { code: 123, errors: [], status: 'something', message: 'some logflare error' },
        }}
      />,
      <ResourcesExceededErrorRenderer
        key="three"
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
        key="four"
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
    ].map((child, i) => (
      <Alert
        key={i}
        variant="danger"
        title="Sorry! An error occurred when fetching data."
        withIcon
        className="w-1/2"
      >
        {child}
      </Alert>
    ))}
  </div>
)
