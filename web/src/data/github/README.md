## Temp

Exploring the ability to import GitHub Discussions into our docs.

https://docs.github.com/en/graphql/overview/explorer

Query:

```


{
  repository(owner: "supabase", name: "supabase") {
    discussions(first: 10) {
      nodes {
        id
        author {
          avatarUrl
          url
          login
        }
        body
        title
        answer {
          author {
            avatarUrl
            login
          }
          body
          createdAt
        }
        createdAt
      }
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
}



```