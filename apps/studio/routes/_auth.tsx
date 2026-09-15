import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: AuthShell,
})

// No shared layout here. In Next only pages/sign-in.tsx wraps itself in
// AuthenticationLayout via getLayout; every other auth page renders just its
// inner layout (SignInLayout / ForgotPasswordLayout / InterstitialLayout) with
// no AuthenticationLayout. The sign-in route wraps AuthenticationLayout at the
// leaf to match.
function AuthShell() {
  return <Outlet />
}
