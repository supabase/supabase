# custom-jwt-validation

This function exemplifies how to use a custom JWT validation.

Since Supabase legacy JWT Secret will be deprecated, users that would like to verify JWT or integrate with a custom provider should implement it manually.

> see [Upcoming changes to Supabase API Keys #29260](https://github.com/orgs/supabase/discussions/29260)

To simplify this task, Supabase provides a collection of JWT validation examples
that can be found at [`_shared/jwt/`](https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/_shared/jwt) folder.

## Setup

1. Copy/download the JWT template, then import and use it inside your edge function.

```bash
curl -O https://raw.githubusercontent.com/supabase/supabase/refs/heads/master/examples/edge-functions/supabase/functions/_shared/jwt/<template>.ts
```

2. Add any required Environment-Variable to a `.env` file, see inside of the
   respective `_shared/jwt/template.ts` file to find which variables is required.
