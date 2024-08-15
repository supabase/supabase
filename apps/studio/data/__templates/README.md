# Templates for Tanstack Query queries & mutations

## Usage

1. Duplicate the files in the \_\_templates directory you need depending on your use case.
2. Rename the files to match your resource name.
3. Update the `resource` variables to match your resource name. Usually find and replace works great here if you use case sensitive search (`resource` then `Resource`)
4. Implement your `queryFn` function.

Referencing the other files in the `data` directory is a good way to see how to use the library.

### SQL queries and mutations

The dashboard often needs to query the users database directly. There are already some reusable hooks for this in `data/sql`. Reference the `data/fdw` directory for an example of how to use them.

Note that the query key of the `useExecuteSqlQuery` hook will be automatically filled with an md5 hash of the SQL query, unless you provide a name for the query.

## Files

### `resources-query.ts`

For queries that return a list of results.

> :warning: Should only be used for simple lists, as it does not include any pagination. `useInfiniteQuery` should be used instead.

### `resource-query.ts`

For getting a single item based on parameter(s). `id` is used in this example but can be updated to whatever is needed.

### `resource-update-mutation.ts`

For updating a resource. This can easily be adapted to work for create, delete, or any verb that is needed. You may need to modify the `invalidateQueries` section depending on your use case. For example removing:

```ts
queryClient.invalidateQueries(resourceKeys.resource(projectRef, id))
```

if you are creating a new resource.

### `keys.ts`

Standardized keys for use with `useQuery` and `invalidateQueries`. This is not required but is a good way to keep things consistent.

## Learning Resources

- [Tanstack Query Docs](https://tanstack.com/query/v4/docs/react/overview)
- [TkDodo's Blog Posts](https://tanstack.com/query/v4/docs/react/community/tkdodos-blog)

The blog posts in particular are very helpful for learning best practices and how to use the library effectively.

## UI Error handling

**All network requests** should be done through queries or mutations as they provide a couple of helpful parameters that can ensure our UI covers all scenarios. The main purpose is so that users are always informed whenever a network request fails, rather than allowing the requests to fail silently in the background and the users are left guessing as to what is happening.

### Queries

The 3 states that are provided in a query (`isLoading`, `isError`, `isSuccess`) **must** be covered in the UI whenever we're using it (unless reasonably unrequired). Typically, we'd use the following UI components to cover them, and the states are mutually exclusive so it's preferred not to nest them in a ternary operator for better readability.

```jsx
const { data, error, isLoading, isError, isSuccess } = useQuery()

return (
  <>
    {isLoading && <GenericSkeletonLoader />}

    {isError && <AlertError subject="A subject" error={error} />}

    {isSuccess && <div>Your UI component</div>}
  </>
)
```

### Mutations

The parameter `onError` can be passed when initializing the mutation, where an appropriate UI behavior should be triggered (usually a toast will be fine). If `onError` is not provided, we will then default to a toast message that will be called from within the mutation itself which should handle most cases. However, if there is a specific way that the error should be handled, then this should be passed via the `onError` parameter. (There's no need to repeat the error handling if the default behavior is sufficient)

We should also aim to convert most of the `mutateAsync` to `mutate`, otherwise we'd need to wrap all the `mutateAsync` calls in try catches just to ensure that the client doesn't crash when the request throws an error in the mutation. There's currently a mix due to the Form component that we're using, in particular when a method from the Form component such as `resetForm` needs to be called after the request is completed successfully.

```jsx
const { mutate: someAction } = useMutation({
  onSuccess: (res) => {
    toast.success('Success')
  },
  onError: (error) => {
    toast.error(`Failed: ${error.message}`)
  },
})

const onConfirm = async () => {
  // Assuming that your mutation needs a URL param like project ref
  // This check is just to satisfy the linting - there's an implicit assumption that
  // projectRef here will definitely be available since its obtained from the URL
  if (!projectRef) return console.error('Project ref is required')

  // Any logic before calling the mutation
  someAction({ projectRef, otherParameters })
}
```
