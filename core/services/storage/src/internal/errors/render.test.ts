import { ErrorCode } from './codes'
import { render } from './render'

describe('render', () => {
  it('preserves message details for plain errors', () => {
    expect(render(new Error('Entity expansion limit exceeded'))).toEqual({
      statusCode: '500',
      code: 'InternalError',
      error: 'InternalError',
      message: 'Entity expansion limit exceeded',
    })
  })

  it('uses renderable error payloads as-is', () => {
    const error = {
      render: () => ({
        statusCode: '499',
        code: ErrorCode.AbortedTerminate,
        error: ErrorCode.AbortedTerminate,
        message: 'client disconnected',
      }),
    }

    expect(render(error)).toEqual({
      statusCode: '499',
      code: ErrorCode.AbortedTerminate,
      error: ErrorCode.AbortedTerminate,
      message: 'client disconnected',
    })
  })

  it('ignores non-callable render properties', () => {
    expect(render({ render: 'not-a-function' })).toEqual({
      statusCode: '500',
      code: 'InternalError',
      error: 'InternalError',
      message: 'Internal server error',
    })
  })
})
