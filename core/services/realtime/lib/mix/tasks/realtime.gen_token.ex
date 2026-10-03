defmodule Mix.Tasks.Realtime.GenToken do
  @shortdoc "Sign a JWT for a local tenant"

  @moduledoc """
  Signs a JWT you can hand to a client, curl, or the Inspector to authenticate against a local
  tenant, without reaching for jwt.io or a one-off script.

      mix realtime.gen_token
      mix realtime.gen_token --role service_role --ttl 3600
      mix realtime.gen_token --secret my-custom-secret

  Defaults to the `authenticated` role and a 24 hour expiry. Signs with `API_JWT_SECRET` unless
  `--secret` is passed; fails if neither is set, since that's the secret `mise run db-start`
  seeded the tenant with.
  """
  use Mix.Task

  @default_ttl_seconds 60 * 60 * 24

  @impl Mix.Task
  def run(args) do
    {opts, _, _} = OptionParser.parse(args, strict: [role: :string, secret: :string, ttl: :integer])

    {:ok, _} = Application.ensure_all_started(:joken)

    role = opts[:role] || "authenticated"
    secret = opts[:secret] || System.get_env("API_JWT_SECRET") || missing_secret!()
    ttl = opts[:ttl] || @default_ttl_seconds

    claims = %{"role" => role, "exp" => System.system_time(:second) + ttl}
    signer = Joken.Signer.create("HS256", secret)
    {:ok, token, _claims} = Joken.encode_and_sign(claims, signer)

    Mix.shell().info(token)
  end

  @spec missing_secret! :: no_return()
  defp missing_secret! do
    Mix.raise("No JWT secret: set API_JWT_SECRET (mise.toml does under `mise run dev`) or pass --secret")
  end
end
