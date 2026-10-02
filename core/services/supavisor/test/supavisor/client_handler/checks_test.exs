defmodule Supavisor.ClientHandler.ChecksTest do
  use ExUnit.Case, async: true

  alias Supavisor.ClientHandler.Checks
  alias Supavisor.Errors.TenantBannedError

  defp banned_tenant(banned_until) do
    %{
      tenant: %{
        banned_at: ~U[2026-01-01 00:00:00Z],
        ban_reason: "test reason",
        banned_until: banned_until
      }
    }
  end

  describe "check_tenant_not_banned/2 with banned_until" do
    test "allows connection when now is after banned_until" do
      banned_until = ~U[2026-04-08 12:00:00Z]
      now = ~U[2026-04-08 12:00:01Z]
      assert :ok = Checks.check_tenant_not_banned(banned_tenant(banned_until), now)
    end

    test "tenant is still banned at the exact time of banned_until" do
      banned_until = ~U[2026-04-08 12:00:00Z]

      assert {:error, %TenantBannedError{ban_reason: "test reason"}} =
               Checks.check_tenant_not_banned(banned_tenant(banned_until), banned_until)
    end

    test "tenant is banned when now is before banned_until" do
      banned_until = ~U[2026-04-08 12:00:00Z]
      now = ~U[2026-04-08 11:59:59Z]

      assert {:error, %TenantBannedError{ban_reason: "test reason"}} =
               Checks.check_tenant_not_banned(banned_tenant(banned_until), now)
    end
  end

  describe "check_tenant_not_banned/2 without banned_until" do
    test "returns error when tenant is banned with no expiry" do
      data = %{
        tenant: %{banned_at: ~U[2026-01-01 00:00:00Z], ban_reason: "permanent", banned_until: nil}
      }

      assert {:error, %TenantBannedError{ban_reason: "permanent"}} =
               Checks.check_tenant_not_banned(data)
    end

    test "allows connection when tenant is not banned" do
      data = %{tenant: %{banned_at: nil, ban_reason: nil, banned_until: nil}}
      assert :ok = Checks.check_tenant_not_banned(data)
    end
  end
end
