defmodule Realtime.OidTest do
  use ExUnit.Case, async: true
  import Realtime.Adapters.Postgres.OidDatabase
  doctest Realtime.Adapters.Postgres.OidDatabase
end
