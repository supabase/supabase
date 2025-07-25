---
id: 'managing-config'
title: 'Managing config and secrets'
description: 'Managing local configuration using config.toml.'
---

The Supabase CLI uses a `config.toml` file to manage local configuration. This file is located in the `supabase` directory of your project.

## Config reference

The `config.toml` file is automatically created when you run `supabase init`.

There are a wide variety of options available, which can be found in the [CLI Config Reference](/docs/guides/cli/config).

For example, to enable the "Apple" OAuth provider for local development, you can append the following information to `config.toml`:

```toml
[auth.external.apple]
enabled = false
client_id = ""
secret = ""
redirect_uri = "" # Overrides the default auth redirectUrl.
```

## Using secrets inside config.toml

You can reference environment variables within the `config.toml` file using the `env()` function. This will detect any values stored in an `.env` file at the root of your project directory. This is particularly useful for storing sensitive information like API keys, and any other values that you don't want to check into version control.

```
.
├── .env
├── .env.example
└── supabase
    └── config.toml
```

<Admonition type="danger">

Do NOT commit your `.env` into git. Be sure to configure your `.gitignore` to exclude this file.

</Admonition>

For example, if your `.env` contained the following values:

```bash
GITHUB_CLIENT_ID=""
GITHUB_SECRET=""
```

Then you would reference them inside of our `config.toml` like this:

```toml
[auth.external.github]
enabled = true
client_id = "env(GITHUB_CLIENT_ID)"
secret = "env(GITHUB_SECRET)"
redirect_uri = "" # Overrides the default auth redirectUrl.
```

### Going further

For more advanced secrets management workflows, including:

- **Using dotenvx for encrypted secrets**: Learn how to securely manage environment variables across different branches and environments
- **Branch-specific secrets**: Understand how to manage secrets for different deployment environments
- **Encrypted configuration values**: Use encrypted values directly in your `config.toml`

See the [Managing secrets for branches](/docs/guides/deployment/branching#managing-secrets-for-branches) section in our branching documentation, or check out the [dotenvx example repository](https://github.com/supabase/supabase/blob/master/examples/slack-clone/nextjs-slack-clone-dotenvx/README.md) for a complete implementation.
