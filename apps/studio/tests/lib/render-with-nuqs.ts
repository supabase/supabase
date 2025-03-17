import { render } from '@testing-library/react'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'

export type TestingAdapterProps = Parameters<typeof withNuqsTestingAdapter>[0]

/**
 * Renders a component with the Nuqs testing adapter.
 * @param ui - The component to render.
 * @param nuqsOpts - The options to pass to the Nuqs testing adapter.
 * @returns The rendered component.
 *
 * @docs https://nuqs.47ng.com/docs/testing
 */
export const renderWithNuqs = (ui: React.ReactElement, nuqsOpts?: TestingAdapterProps) => {
  return render(ui, {
    wrapper: withNuqsTestingAdapter(nuqsOpts),
  })
}
