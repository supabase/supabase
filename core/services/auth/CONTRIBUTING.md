# CONTRIBUTING

We would love to have contributions from each and every one of you in the community be it big or small and you are the ones who motivate us to do better than what we do today.

## Code Of Conduct

Please help us keep all our projects open and inclusive. Kindly follow our [Code of Conduct](CODE_OF_CONDUCT.md) to keep the ecosystem healthy and friendly for all.

## Quick Start

Auth has a development container setup that makes it easy to get started contributing. This setup only requires that [Docker](https://www.docker.com/get-started) is setup on your system. The development container setup includes a PostgreSQL container with migrations already applied and a container running GoTrue that will perform a hot reload when changes to the source code are detected.

If you would like to run Auth locally or learn more about what these containers are doing for you, continue reading the [Setup and Tooling](#setup-and-tooling) section below. Otherwise, you can skip ahead to the [How To Verify that GoTrue is Available](#how-to-verify-that-auth-is-available) section to learn about working with and developing GoTrue.

Before using the containers, you will need to make sure an `.env.docker` file exists by making a copy of `example.docker.env` and configuring it for your needs. The set of env vars in `example.docker.env` only contain the necessary env vars for auth to start in a docker environment. For the full list of env vars, please refer to `example.env` and copy over the necessary ones into your `.env.docker` file.

The following are some basic commands. A full and up to date list of commands can be found in the project's `Makefile` or by running `make help`.

### Starting the containers

Start the containers as described above in an attached state with log output.

```bash
make dev
```

### Running tests in the containers

Start the containers with a fresh database and run the project's tests.

```bash
make docker-test
```

### Removing the containers

Remove both containers and their volumes. This removes any data associated with the containers.

```bash
make docker-clean
```

### Rebuild the containers

Fully rebuild the containers without using any cached layers.

```bash
make docker-build
```

## Setup and Tooling

Auth -- as the name implies -- is a user registration and authentication API developed in [Go](https://go.dev).

It connects to a [PostgreSQL](https://www.postgresql.org) database in order to store authentication data, [Soda CLI](https://gobuffalo.io/en/docs/db/toolbox) to manage database schema and migrations,
and runs inside a [Docker](https://www.docker.com/get-started) container.

Therefore, to contribute to Auth you will need to install these tools.

### Install Tools

- Install [Go](https://go.dev) 1.22

```zsh
# Via Homebrew on macOS
brew install go@1.22

# Set the environment variable in the ~/.zshrc file
echo 'export PATH="/opt/homebrew/opt/go@1.22/bin:$PATH"' >> ~/.zshrc
```

- Install [Docker](https://www.docker.com/get-started)

```zsh
# Via Homebrew on macOS
brew install docker
```

Or, if you prefer, download [Docker Desktop](https://www.docker.com/get-started).

- Install [Soda CLI](https://gobuffalo.io/en/docs/db/toolbox)

```zsh
# Via Homebrew on macOS
brew install gobuffalo/tap/pop
```

If you are on macOS Catalina you may [run into issues installing Soda with Brew](https://github.com/gobuffalo/homebrew-tap/issues/5). Do check your `GOPATH` and run

`go build -o /bin/soda github.com/gobuffalo/pop/soda` to resolve.

- Clone the Auth [repository](https://github.com/supabase/auth)

```zsh
git clone https://github.com/supabase/auth
```

- (Optional, but recommended) Install [lefthook](https://github.com/evilmartians/lefthook) and activate the repo's git hooks. This mirrors CI's checks locally before each commit, so a mistake is caught early instead of failing CI. See `lefthook.yml` for the current list.

```zsh
# See https://github.com/evilmartians/lefthook/blob/master/docs/install.md for all install methods
brew install lefthook

# From the repo root, activate the hooks defined in lefthook.yml
make hooks
```

### Install Auth

To begin installation, be sure to start from the root directory.

- `cd auth`

To complete installation, you will:

- Install the PostgreSQL Docker image
- Create the DB Schema and Migrations
- Setup a local `.env` for environment variables
- Compile Auth
- Run the Auth binary executable

#### Installation Steps

1. Start Docker
2. To install the PostgreSQL Docker image, run:

```zsh
# Builds the postgres image
docker-compose -f docker-compose-dev.yml build postgres

# Runs the postgres container
docker-compose -f docker-compose-dev.yml up postgres
```

You should then see in Docker that `auth-postgres-1` is running on `port: 5432`.

> **Important** If you happen to already have a local running instance of Postgres running on the port `5432` because you
> may have installed via [homebrew on macOS](https://formulae.brew.sh/formula/postgresql) then be certain to stop the process using:
>
> - `brew services stop postgresql`
>
> If you need to run the test environment on another port, you will need to modify several configuration files to use a different custom port.

3. Next compile the Auth binary:

When you fork a repository, GitHub does not automatically copy all the tags (tags are not included by default). To ensure the correct tag is set before building the binary, you need to fetch the tags from the upstream repository and push them to your fork. Follow these steps:

```zsh
# Fetch the tags from the upstream repository
git fetch upstream --tags

# Push the tags to your fork
git push origin --tags
```

Then build the binary by running:

```zsh
make build
```

4. To setup the database schema via Soda, run:

```zsh
make migrate_test
```

You should see log messages that indicate that the Auth migrations were applied successfully:

```terminal
INFO[0000] Auth migrations applied successfully
DEBU[0000] after status
[POP] 2021/12/15 10:44:36 sql - SELECT EXISTS (SELECT schema_migrations.* FROM schema_migrations AS schema_migrations WHERE version = $1) | ["20210710035447"]
[POP] 2021/12/15 10:44:36 sql - SELECT EXISTS (SELECT schema_migrations.* FROM schema_migrations AS schema_migrations WHERE version = $1) | ["20210722035447"]
[POP] 2021/12/15 10:44:36 sql - SELECT EXISTS (SELECT schema_migrations.* FROM schema_migrations AS schema_migrations WHERE version = $1) | ["20210730183235"]
[POP] 2021/12/15 10:44:36 sql - SELECT EXISTS (SELECT schema_migrations.* FROM schema_migrations AS schema_migrations WHERE version = $1) | ["20210909172000"]
[POP] 2021/12/15 10:44:36 sql - SELECT EXISTS (SELECT schema_migrations.* FROM schema_migrations AS schema_migrations WHERE version = $1) | ["20211122151130"]
Version          Name                         Status
20210710035447   alter_users                  Applied
20210722035447   adds_confirmed_at            Applied
20210730183235   add_email_change_confirmed   Applied
20210909172000   create_identities_table      Applied
20211122151130   create_user_id_idx           Applied
```

That lists each migration that was applied. Note: there may be more migrations than those listed.

4. Create a `.env` file in the root of the project and copy the following config in [example.env](example.env). Set the values to GOTRUE_SMS_TEST_OTP_VALID_UNTIL in the `.env` file.

5. In order to have Auth connect to your PostgreSQL database running in Docker, it is important to set a connection string like:

```
DATABASE_URL="postgres://supabase_auth_admin:root@localhost:5432/postgres"
```

> Important: Auth requires a set of SMTP credentials to run, you can generate your own SMTP credentials via an SMTP provider such as AWS SES, SendGrid, MailChimp, SendInBlue or any other SMTP providers.

6. Then finally Start Auth
7. Verify that Auth is Available

### Starting Auth

Start Auth by running the executable:

```zsh
./auth
```

This command will re-run migrations and then indicate that Auth has started:

```zsh
INFO[0000] Auth API started on: localhost:9999
```

### How To Verify that Auth is Available

To test that your Auth is up and available, you can query the `health` endpoint at `http://localhost:9999/health`. You should see a response similar to:

```json
{
  "description": "Auth is a user registration and authentication API",
  "name": "Auth",
  "version": ""
}
```

To see the current settings, make a request to `http://localhost:9999/settings` and you should see a response similar to:

```json
{
  "external": {
    "apple": false,
    "azure": false,
    "bitbucket": false,
    "discord": false,
    "github": false,
    "gitlab": false,
    "google": false,
    "facebook": false,
    "snapchat": false,
    "spotify": false,
    "slack": false,
    "slack_oidc": false,
    "twitch": true,
    "twitter": false,
    "email": true,
    "phone": false,
    "saml": false
  },
  "external_labels": {
    "saml": "auth0"
  },
  "disable_signup": false,
  "mailer_autoconfirm": false,
  "phone_autoconfirm": false,
  "sms_provider": "twilio"
}
```

## How to Use Admin API Endpoints

To test the admin endpoints (or other api endpoints), you can invoke via HTTP requests. Using [Insomnia](https://insomnia.rest/products/insomnia) can help you issue these requests.

You will need to know the `GOTRUE_JWT_SECRET` configured in the `.env` settings.

Also, you must generate a JWT with the signature which has the `supabase_admin` role (or one that is specified in `GOTRUE_JWT_ADMIN_ROLES`).

For example:

```json
{
  "role": "supabase_admin"
}
```

You can sign this payload using the [JWT.io Debugger](https://jwt.io/#debugger-io) but make sure that `secret base64 encoded` is unchecked.

Then you can use this JWT as a Bearer token for admin requests.

### Create User (aka Sign Up a User)

To create a new user, `POST /admin/users` with the payload:

```json
{
  "email": "user@example.com",
  "password": "12345678"
}
```

#### Request

```
POST /admin/users HTTP/1.1
Host: localhost:9999
User-Agent: insomnia/2021.7.2
Content-Type: application/json
Authorization: Bearer <YOUR_SIGNED_JWT>
Accept: */*
Content-Length: 57
```

#### Response

And you should get a new user:

```json
{
  "id": "e78c512d-68e4-482b-901b-75003e89acae",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "user@example.com",
  "phone": "",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {},
  "identities": null,
  "created_at": "2021-12-15T12:40:03.507551-05:00",
  "updated_at": "2021-12-15T12:40:03.512067-05:00"
}
```

### List/Find Users

To create a new user, make a request to `GET /admin/users`.

#### Request

```
GET /admin/users HTTP/1.1
Host: localhost:9999
User-Agent: insomnia/2021.7.2
Authorization: Bearer <YOUR*SIGNED_JWT>
Accept: */\_
```

#### Response

The response from `/admin/users` should return all users:

```json
{
  "aud": "authenticated",
  "users": [
    {
      "id": "b7fd0253-6e16-4d4e-b61b-5943cb1b2102",
      "aud": "authenticated",
      "role": "authenticated",
      "email": "user+4@example.com",
      "phone": "",
      "app_metadata": {
        "provider": "email",
        "providers": ["email"]
      },
      "user_metadata": {},
      "identities": null,
      "created_at": "2021-12-15T12:43:58.12207-05:00",
      "updated_at": "2021-12-15T12:43:58.122073-05:00"
    },
    {
      "id": "d69ae847-99be-4642-868f-439c2cdd9af4",
      "aud": "authenticated",
      "role": "authenticated",
      "email": "user+3@example.com",
      "phone": "",
      "app_metadata": {
        "provider": "email",
        "providers": ["email"]
      },
      "user_metadata": {},
      "identities": null,
      "created_at": "2021-12-15T12:43:56.730209-05:00",
      "updated_at": "2021-12-15T12:43:56.730213-05:00"
    },
    {
      "id": "7282cf42-344e-4474-bdf6-d48e4968a2e4",
      "aud": "authenticated",
      "role": "authenticated",
      "email": "user+2@example.com",
      "phone": "",
      "app_metadata": {
        "provider": "email",
        "providers": ["email"]
      },
      "user_metadata": {},
      "identities": null,
      "created_at": "2021-12-15T12:43:54.867676-05:00",
      "updated_at": "2021-12-15T12:43:54.867679-05:00"
    },
    {
      "id": "e78c512d-68e4-482b-901b-75003e89acae",
      "aud": "authenticated",
      "role": "authenticated",
      "email": "user@example.com",
      "phone": "",
      "app_metadata": {
        "provider": "email",
        "providers": ["email"]
      },
      "user_metadata": {},
      "identities": null,
      "created_at": "2021-12-15T12:40:03.507551-05:00",
      "updated_at": "2021-12-15T12:40:03.507554-05:00"
    }
  ]
}
```

### Running Database Migrations

If you need to run any new migrations:

```zsh
make migrate_test
```

This passes `--verbose` to the `migrate` command, which logs the name of each
migration as it is applied.

## Testing

Currently, we don't use a separate test database, so the same database created when installing Auth to run locally is used.

The following commands should help in setting up a database and running the tests:

```sh
# Runs the database in a docker container
$ docker-compose -f docker-compose-dev.yml up postgres

# Applies the migrations to the database (requires soda cli)
$ make migrate_test

# Executes the tests
$ make test
```

### Customizing the PostgreSQL Port

if you already run PostgreSQL and need to run your database on a different, custom port,
you will need to make several configuration changes to the following files:

In these examples, we change the port from 5432 to 7432.

> Note: This is not recommended, but if you do, please do not check in changes.

```
// file: docker-compose-dev.yml
ports:
  - 7432:5432 \ 👈 set the first value to your external facing port
```

The port you customize here can them be used in the subsequent configuration:

```
// file: database.yaml
test:
dialect: "postgres"
database: "postgres"
host: {{ envOr "POSTGRES_HOST" "127.0.0.1" }}
port: {{ envOr "POSTGRES_PORT" "7432" }} 👈 set to your port
```

```
// file: test.env
DATABASE_URL="postgres://supabase_auth_admin:root@localhost:7432/postgres" 👈 set to your port
```

```
// file: migrate.sh
export GOTRUE_DB_DATABASE_URL="postgres://supabase_auth_admin:root@localhost:7432/$DB_ENV"
```

## Helpful Docker Commands

```zsh
# Command line into bash on the PostgreSQL container
docker exec -it auth-postgres-1 bash

# Removes Container
docker container rm -f auth-postgres-1

# Removes volume
docker volume rm postgres_data
```

## Updating Package Dependencies

- `make deps`
- `go mod tidy` if necessary

## Submitting Pull Requests

We actively welcome your pull requests.

- Fork the repo and create your branch from `master`.
- If you've added code that should be tested, add tests.
- If you've changed APIs, update the documentation.
- Ensure the test suite passes.
- Make sure your code lints.

### Checklist for Submitting Pull Requests

- Is there a corresponding issue created for it? If so, please include it in the PR description so we can track / refer to it.
- Does your PR follow the [semantic-release commit guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)?
- If the PR is a `feat`, an [RFC](https://github.com/supabase/rfcs) or a detailed description of the design implementation is required. The former (RFC) is preferred before starting on the PR.
- Are the existing tests passing?
- Have you written some tests for your PR?

## Guidelines for Implementing Additional OAuth Providers

> ⚠️ We won't be accepting any additional oauth / sms provider contributions for now because we intend to support these through webhooks or a generic provider in the future.

Please ensure that an end-to-end test is done for the OAuth provider implemented.

An end-to-end test includes:

- Creating an application on the oauth provider site
- Generating your own client_id and secret
- Testing that `http://localhost:9999/authorize?provider=MY_COOL_NEW_PROVIDER` redirects you to the provider sign-in page
- The callback is handled properly
- Gotrue redirects to the `SITE_URL` or one of the URI's specified in the `URI_ALLOW_LIST` with the access_token, provider_token, expiry and refresh_token as query fragments

### Writing tests for the new OAuth provider implemented

Since implementing an additional OAuth provider consists of making api calls to an external api, we set up a mock server to attempt to mock the responses expected from the OAuth provider.

## License

By contributing to Auth, you agree that your contributions will be licensed
under its [MIT license](LICENSE).
