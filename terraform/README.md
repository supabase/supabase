# Terraform Supabase

This repo includes an example of starting a local copy of the Supabase stack via Terraform. At this time, it does not support deployment to a remote VPS.

### Very important notice

This repo is still a work in progress - it should **NOT** be used for production deployments at this time. For example, the Terraform configuration currently created will destroy all volumes when `destroy` is called. You **WILL** lose all data.

Known issues such as this will be resolved in due course.

### Secure values

Please note that your Postgres password, JWT secret and JWT tokens are automatically generated during setup. If you are using the Watchtower plugin, the HTTP API token for that is also automatically generated. In order to retrieve these values for use in an application:

- Your `anon_key` and `service_role_key` can be found in the `kong_data` docker volume, inside the `kong.yml` file
- Your `jwt_secret` can be found in the environmental variables of the `supabase-auth` docker container
- Your `postgres_password` can be found in the environmental variables of the `db` docker container
- If you have enabled the Watchtower plugin, you can find your HTTP API token in the environmental variables of the `watchtower` docker container

As of writing, these values are not output to the terminal or disk as they are considered very sensitive.

The Postgres password is 96 characters in length, while the JWT secret is 64 characters in length. The watchtower HTTP API token is 128 characters in length.

### Instructions

1. Install docker - instructions at https://docs.docker.com/get-docker/
2. Install the Terraform CLI - instructions at https://www.terraform.io/downloads
3. Rename `./supabase/definitions/dotenv.tf.example` to `./supabase/definitions/dotenv.tf`
   a. This file includes the **sensitive** Supabase-related environment variables (except for third-party auth variables)
   b. You should never **commit** this file to git - `dotenv.tf` is already included in `.gitignore`
4. Rename `./plugins/defintions/dotenv.tf.example` to `./plugins/definitions/dotenv.tf`
   a. This file includes all **sensitive** plugin-related environment variables
   b. It should **never** be commited to git
5. Rename `./supabase/definitions/thirdpartyauth.dotenv.tf.example` to `./supabase/definitions/thirdpartyauth.dotenv.tf`
   a. This file is where all third-party auth variables should be set
   b. You should **never** commit this file to git - `thirdpartyauth.dotenv.tf` is already in `.gitignore`, so unless you use a different filename, change the gitignore or place the variables in a different file, you won't accidentally leak your secrets
6. Run `terraform init` from the folder where this readme is located
7. Run `terraform plan` from the folder where this readme is located
8. Run `terraform apply` and type `yes` when prompted

To stop the stack, type `terraform destroy` and type `yes` when prompted.

If there are any errors, please, please, **please** read what the terminal outputs as it will often tell you how to resolve the issue.

If you're still having trouble, you can remove the Terraform dependencies and packages by removing the following from your copy of this repo:

- `.terraform/` folder
- `terraform.tfstate` file
- `terraform.tfstate.backup` file
- `terraform.lock.hcl` file

### Plugins

This repo provides a 'plugin' system which allows you to add some common Docker images and containers to the project.

Inside the `./plugins/definitions` folder, you will find a `provider.tf` file. This file is where you can control which plugins are enabled.

Plugin secret environmental variables can be set in`./plugins/definitions/dotenv.tf.example`. Rename to `dotenv.tf` before attempting to run `terraform` commands.

For example, there is a `USE_PORTAINER` variable block. Inside this block, there is a `default` field. By setting the value of this field to `true`, you will enable the download and provisioning of the Portainer image and container.

- **Current plugins**
  - Portainer (disabled by default)
    - Main plugin file: `./plugins/definitions/WithPortainer.tf`
  - Nginx (disabled by default)
    - This plugin is already configured for use with Supabase
    - Main plugin file: `./plugins/definitions/WithNginx.tf`
    - All variables for Nginx are stored in this file
    - You should ensure you read the comments left in that file if you intend to use this plugin
  - Watchtower (disabled by default)
    - Main plugin file: `./plugins/definitions/WithWatchtower.tf`
    - Environment variable options: https://containrrr.dev/watchtower/arguments/
    - HTTP API (to trigger image and container updates): https://containrrr.dev/watchtower/http-api-mode/
    - The HTTP API token for watchtower is a 128-character random password

### Adding a new plugin

In essence, plugins are simply docker containers that will be initialized and included during setup.

First, you need to ensure that it is possible to toggle the plugin. To do this, add a new `variable` block in `./plugins/definitions/provider.tf`;

```
variable "USE_PLUGIN" {
  type        = bool
  default     = false
  description = "Set default to true if you want to add <Plugin name> to the deployment"
}
```

You should ensure that the `default` is set to false - all plugins are considered optional, but disabled by default.

Then create a new file with a `.tf` extension in the `./plugins/definitions` folder. This file should be named `With<Plugin>.tf` (replace `<plugin>` with the name of your plugin).

Add your Docker images and containers as resources:

```
resource "docker_image" "plugin" {
  name         = "myorganisation/plugin:latest"
  keep_locally = true
  count        = var.USE_PLUGIN ? 1 : 0
}

resource "docker_container" "plugin" {
  count = var.USE_PLUGIN ? 1 : 0
  image = "myorganisation/plugin:latest"
  name  = "plugin"
  ports {
    internal = 11111
    external = 11111
  }
}
```

**The above is just an example!**
The most important part is ensuring that the `count` property of all resources is set to `1` if your variable is `true`, and `0` if it is `false`.

If your container requires any secret environmental variables, place them in `./plugins/defintions/dotenv.tf`. Any non-secret variables should be stored in the same file as the plugin.

You should also ensure that you add the same variables to the `./plugins/definitions/dotenv.tf.example` file **but ensure you remove the secret value before you commit the file**!

### Additional information

This repo allows you to customise the `postgresql.conf` file before deployment. The default config provided within the Supabase docker image (as of 28th February 2022) is included at `./volumes/db/config/postgresql.conf`. The default config should be sufficient, but feel free to adjust this according to your requirements.

Also included is the `kong.yml` config file used by Kong - available at `./volumes/api/kong.tpl`. This is a Terraform template file, meaning that it includes some template variables which are replaced during deployment:

- `${META_URL}` - The URL which docker containers can access the `pg-meta` container at
- `${META_PORT}` - The port which the `pg-meta` container is running on
- `${ANON_KEY}` - The Supabase anon key
- `${SECRET_KEY}` - The supabase service role key

These variables are passed into the template from `docker.containers.tf` and should not be modified. If you want to change any of these value, change them in the `dotenv.tf` file (see instructions section above for details).

The reason for using a template file is that it allows us to keep the environmental variables secret, while also avoiding the need to change them in more than one place. With the normal docker-compose deployment, you have to change some env variables in `kong.yml` as well as in the `.env` file.
