export const useRouter = jest.fn().mockImplementation(() => ({
  query: { ref: '123' },
  push: jest.fn(),
  pathname: 'logs/path',
}))
