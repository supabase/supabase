const MockLayout = jest.fn().mockImplementation(({ children }) => <>{children}</>)
export const LogsLayout = MockLayout
export default MockLayout
