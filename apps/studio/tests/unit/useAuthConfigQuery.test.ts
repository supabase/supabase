import { renderHook } from '@testing-library/react-hooks'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('useAuthConfigQuery', () => {
    const queryClient = new QueryClient()

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client= { queryClient } > { children } </QueryClientProvider>
  )

it('should fetch auth config in self-hosted environments', async () => {
    const { result, waitFor } = renderHook(
        () => useAuthConfigQuery({ projectRef: 'test-project' }),
        { wrapper }
    )

    await waitFor(() => result.current.isSuccess)

    expect(result.current.data).toBeDefined()
})
})