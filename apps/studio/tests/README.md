# UI Testing Notes

## Rules

- All tests should be run consistently (avoid situations whereby tests fails "sometimes")

- Group tests in folders based on the feature they are testing. Avoid file/folder based folder names since those can change and we will forget to update the tests.

Examples: /logs /reports /projects /database-settings /auth

## Custom Render and Custom Render Hook

`customRender` and `customRenderHook` are wrappers around `render` and `renderHook` that add some necessary providers like `QueryClientProvider`, `TooltipProvider` and `NuqsTestingAdapter`.

Generally use those instead of the default `render` and `renderHook` functions.

```ts
import { customRender, customRenderHook } from 'tests/lib/custom-render'

customRender(<MyComponent />)
customRenderHook(() => useMyHook())
```

## Mocking API Requests

To mock API requests, we use the `msw` library.

Global mocks can be found in `tests/lib/msw-global-api-mocks.ts`.

To mock an endpoint you can use the `addAPIMock` function. Make sure to add the mock in the `beforeEach` hook. It won't work with `beforeAll` if you have many tests.

```ts
beforeEach(() => {
  addAPIMock({
    method: 'get',
    path: '/api/my-endpoint',
    response: {
      data: { foo: 'bar' },
    },
  })
})
```

### API Mocking Tips:

- Keep mocks in the same folder as the tests that use them
- Add a test to verify the mock is working

This will make debugging and updating the mocks easier.

```ts
test('mock is working', async () => {
  const response = await fetch('/api/my-endpoint')
  expect(response.json()).resolves.toEqual({ data: { foo: 'bar' } })
})
```

## Mocking Nuqs URL Parameters

To render a component that uses Nuqs with some predefined query parameters, you can use `customRender` with the `nuqs` prop.

```ts

customRender(<MyComponent />, {
  nuqs: {
    searchParams: {
      search: 'hello world',
    },
  },
})
```

## `<Popover>` vs `<Dropdown>`

When simulating clicks on these components, do the following:

```js
// for Popovers
import userEvent from '@testing-library/user-event'
await userEvent.click('Hello world')

// for Dropdowns
import clickDropdown from 'tests/helpers'
clickDropdown('Hello world')
```
