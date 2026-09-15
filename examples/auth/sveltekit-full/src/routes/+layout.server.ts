import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { claims }, cookies }) => {
  return {
    claims,
    cookies: cookies.getAll(),
  }
}
