import { type RouteConfig, route, index } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('notes', 'routes/notes.tsx'),
  route('sign-in', 'routes/sign-in.tsx'),
  route('sign-up', 'routes/sign-up.tsx'),
  route('sign-out', 'routes/sign-out.tsx'),
  route('forgot-password', 'routes/forgot-password.tsx'),
  route('protected', 'routes/protected.tsx'),
  route('client-side-notes', 'routes/client-side-notes.tsx'),
  route('dropzone', 'routes/dropzone.tsx'),
] satisfies RouteConfig
