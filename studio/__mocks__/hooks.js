export const useFlag = jest.fn().mockReturnValue(true)
export const checkPermissions = jest.fn().mockReturnValue(true)

const { useStore, StoreProvider } = jest.requireActual('hooks')
export const useStore = useStore

export const useParams = jest.fn().mockImplementation(() => ({ ref: '123' }))

// mocks browser event listener adding/removing
window.matchMedia = jest.fn().mockReturnValue({
  removeEventListener: jest.fn(),
})
export const StoreProvider = StoreProvider

export const withAuth = jest.fn()
