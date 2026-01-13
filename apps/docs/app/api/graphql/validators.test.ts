import { buildSchema, parse, validate } from 'graphql'
import { describe, expect, test } from 'vitest'
import { createQueryDepthLimiter } from './validators'

describe('createQueryDepthLimiter', () => {
  // Create a test schema
  const schema = buildSchema(`
    type Post {
      id: ID!
      title: String
      content: String
      author: User
      comments: [Comment]
    }

    type User {
      id: ID!
      name: String
      email: String
      posts: [Post]
      friends: [User]
    }

    type Comment {
      id: ID!
      text: String
      author: User
      post: Post
      replies: [Comment]
    }

    type Query {
      post(id: ID!): Post
      user(id: ID!): User
      posts: [Post]
      users: [User]
    }
  `)

  test('should not report error for queries under max depth', () => {
    const query = `
      query {
        posts {
          title
          author {
            name
          }
        }
      }
    `
    const queryAST = parse(query)
    const maxDepth = 3
    const errors = validate(schema, queryAST, [createQueryDepthLimiter(maxDepth)])
    expect(errors).toHaveLength(0)
  })

  test('should report error for queries exceeding max depth', () => {
    const query = `
      query {
        posts {
          title
          author {
            name
            posts {
              title
            }
          }
        }
      }
    `
    const queryAST = parse(query)
    const maxDepth = 3
    const errors = validate(schema, queryAST, [createQueryDepthLimiter(maxDepth)])
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toContain('Query exceeds maximum depth of 3')
  })

  test('should ignore __typename fields when calculating depth', () => {
    const query = `
      query {
        posts {
          __typename
          title
          author {
            __typename
            name
            posts {
              __typename
            }
          }
        }
      }
    `
    const queryAST = parse(query)
    const maxDepth = 3
    const errors = validate(schema, queryAST, [createQueryDepthLimiter(maxDepth)])
    expect(errors).toHaveLength(0)
  })

  test('should handle fragments correctly', () => {
    const query = `
      fragment UserDetails on User {
        id
        name
        posts {
          title
        }
      }

      query {
        users {
          ...UserDetails
        }
      }
    `
    const queryAST = parse(query)
    const maxDepth = 3
    const errors = validate(schema, queryAST, [createQueryDepthLimiter(maxDepth)])
    expect(errors).toHaveLength(0)
  })

  test('should report error for fragments exceeding max depth', () => {
    const query = `
      fragment UserDetails on User {
        id
        name
        posts {
          title
          author {
            name
          }
        }
      }

      query {
        users {
          ...UserDetails
        }
      }
    `
    const queryAST = parse(query)
    const maxDepth = 3
    const errors = validate(schema, queryAST, [createQueryDepthLimiter(maxDepth)])
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toContain(
      'Fragment spread "UserDetails" causes query to exceed maximum depth'
    )
  })

  test('should report error for fragment spreads causing excessive depth', () => {
    const query = `
      fragment PostDetails on Post {
        title
        content
      }

      fragment UserDetails on User {
        name
        posts {
          ...PostDetails
        }
      }

      query {
        users {
          friends {
            ...UserDetails
          }
        }
      }
    `
    const queryAST = parse(query)
    const maxDepth = 3
    const errors = validate(schema, queryAST, [createQueryDepthLimiter(maxDepth)])
    expect(errors.length).toBeGreaterThan(0)
  })

  test('should handle nested fragments correctly', () => {
    const query = `
      fragment CommentDetails on Comment {
        text
        author {
          name
        }
      }

      fragment PostDetails on Post {
        title
        comments {
          ...CommentDetails
        }
      }

      query {
        posts {
          ...PostDetails
        }
      }
    `
    const queryAST = parse(query)
    const maxDepth = 3
    const errors = validate(schema, queryAST, [createQueryDepthLimiter(maxDepth)])
    expect(errors.length).toBeGreaterThan(0)
  })

  test('should handle inline fragments', () => {
    const query = `
      query {
        posts {
          ... on Post {
            title
            author {
              name
            }
          }
        }
      }
    `
    const queryAST = parse(query)
    const maxDepth = 3
    const errors = validate(schema, queryAST, [createQueryDepthLimiter(maxDepth)])
    expect(errors).toHaveLength(0)
  })

  test('should detect circular fragment references', () => {
    const query = `
      fragment UserPosts on User {
        posts {
          author {
            ...UserPosts
          }
        }
      }

      query {
        users {
          ...UserPosts
        }
      }
    `
    const queryAST = parse(query)
    const maxDepth = 5
    // This should not go into infinite recursion
    const errors = validate(schema, queryAST, [createQueryDepthLimiter(maxDepth)])
    expect(errors.length).toBeGreaterThan(0)
  })
})
