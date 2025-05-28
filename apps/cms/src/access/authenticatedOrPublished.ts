import type { Access } from 'payload'

export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  return true
  
  if (user) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
