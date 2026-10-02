defmodule Supavisor.FixturesHelpers do
  @moduledoc false

  def start_pool(id, secret) do
    Supavisor.start(id, secret)
  end
end
