import { render, screen } from '@testing-library/react'
import { AuthProvidersLayout } from '@/components/layouts/AuthLayout/AuthProvidersLayout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('AuthProvidersLayout', () => {
    const queryClient = new QueryClient()

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    it('should render the layout with navigation items', () => {
        render(
            <AuthProvidersLayout>
                <div>Test Content</div>
            </AuthProvidersLayout>,
            { wrapper }
        )

        expect(screen.getByText('Sign In / Providers')).toBeInTheDocument()
        expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
})