export const useFlag = jest.fn().mockReturnValue(true)
export const checkPermissions = jest.fn().mockReturnValue(true)
export const useProjectSubscription = jest.fn().mockReturnValue({
  subscription: {
    tier: {
      supabase_prod_id: 'tier_free',
    },
  },
})

export const { useStore, StoreProvider } = jest.requireActual('hooks')

// mocks browser event listener adding/removing
window.matchMedia = jest.fn().mockReturnValue({
  removeEventListener: jest.fn(),
})
export const withAuth = jest.fn()
