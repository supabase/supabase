---
title = "Customizing Emails by Language"
github_url = "https://github.com/orgs/supabase/discussions/21227"
date_created = "2024-02-13T16:03:27+00:00"
topics = [ "auth" ]
keywords = [ "emails" ]
database_id = "2ebc2849-0cf7-4c94-ac13-22167a196a92"
---

When you register a user, you can create meta-data about them.

Creating meta-data with the JS-Client's [signUp function](/docs/reference/javascript/auth-signup?example=sign-up-with-additional-user-metadata)

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'email@some_[email.com](http://email.com/)',
  password: 'example-password',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
      age: 27,
    },
  },
})
```

The above example creates a user entry that includes information about their name and age. The data is stored in the auth.users table in the `auth.raw_user_meta_data` column. You can view it in the auth schema with the [SQL Editor](/dashboard/project/_/editor).

It can be accessed in a project's [Email Templates](/dashboard/project/_/auth/templates). Below is an example:

```html
<h2>Hello, {{ .Data.first_name }} {{ .Data.last_name }}!</h2>

<p>Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your account</a></p>
```

If you need to update a user's meta-data, you can do so with the [`updateUser`](/docs/reference/javascript/auth-updateuser?example=update-the-users-metadata) function.

The meta-data can be used to store a user's language preferences. You could then use "if statements" in the email template to set the response for a specific language:

```html
{{if eq .Data.language "en" }}
<h1>Welcome!</h1>
{{ else if eq .Data.language "pl" }}
<h1>Witamy!</h1>
{{ else }}
<h1>chuS'ugh, tera' je (Klingon)</h1>
{{end}}
```

Supabase uses the [Go Templating Language](https://pkg.go.dev/text/template) to render emails. It has advanced features for conditions that you may want to [explore](https://gohugo.io/templates/introduction/). For more examples, there is a [GitHub discussion](https://github.com/supabase/gotrue/issues/80#issuecomment-1552264148) that discusses advanced language templates.
