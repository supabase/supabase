const MockLayout = jest.fn().mockImplementation(({ children }) => <>{children}</>)
export const LogsExplorerLayout = MockLayout
export default MockLayout
