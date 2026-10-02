defmodule Supavisor.TenantSupervisorTest do
  use ExUnit.Case, async: true

  test "tenant supervisor child spec" do
    child_spec = Supavisor.TenantSupervisor.child_spec(%{id: nil})

    # Type being `:supervisor` is important for hot code reloading
    # to affect it's children
    assert child_spec.type == :supervisor

    # Restart being `:transient` avoids a bad pool impacting others
    assert child_spec.restart == :transient
  end
end
