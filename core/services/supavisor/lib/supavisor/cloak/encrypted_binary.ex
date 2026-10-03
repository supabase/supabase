defmodule Supavisor.Encrypted.Binary do
  @moduledoc false
  use Cloak.Ecto.Binary, vault: Supavisor.Vault
end
