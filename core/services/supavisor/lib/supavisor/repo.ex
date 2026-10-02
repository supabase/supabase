defmodule Supavisor.Repo do
  use Ecto.Repo,
    otp_app: :supavisor,
    adapter: Ecto.Adapters.Postgres
end
