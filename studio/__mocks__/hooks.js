export const useFlag = jest.fn().mockReturnValue(true)
export const useCheckPermissions = jest.fn().mockReturnValue(true)

const { useStore: _useStore, StoreProvider: _StoreProvider } = jest.requireActual('hooks')
export const useStore = _useStore

export const useParams = jest.fn().mockImplementation(() => ({ ref: '123' }))

// mocks browser event listener adding/removing
window.matchMedia = jest.fn().mockReturnValue({
  removeEventListener: jest.fn(),
})
export const StoreProvider = _StoreProvider

export const withAuth = jest.fn()
