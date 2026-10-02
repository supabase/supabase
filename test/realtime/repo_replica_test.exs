defmodule Realtime.Repo.ReplicaTest do
  # application env being changed
  use ExUnit.Case, async: false
  alias Realtime.Repo.Replica

  setup do
    previous_platform = Application.get_env(:realtime, :platform)
    previous_region = Application.get_env(:realtime, :region)
    previous_master_region = Application.get_env(:realtime, :master_region)
    previous_main_replica = Application.get_env(:realtime, Replica)

    on_exit(fn ->
      Application.put_env(:realtime, :platform, previous_platform)
      Application.put_env(:realtime, :region, previous_region)
      Application.put_env(:realtime, :master_region, previous_master_region)
      Application.delete_env(:realtime, Replica)

      if previous_main_replica do
        Application.put_env(:realtime, Replica, previous_main_replica)
      end
    end)
  end

  describe "handle aws platform" do
    for {region, mod} <- Replica.replicas_aws() do
      setup do
        Application.put_env(:realtime, :platform, :aws)
        Application.put_env(:realtime, :master_region, "special-region")
        :ok
      end

      test "handles #{region} region" do
        Application.put_env(:realtime, :region, unquote(region))
        replica_asserts(unquote(mod), Replica.replica())
      end

      test "defaults to Realtime.Repo if region is equal to master region on #{region}" do
        Application.put_env(:realtime, :region, unquote(region))
        Application.put_env(:realtime, :master_region, unquote(region))
        replica_asserts(Realtime.Repo, Replica.replica())
      end
    end

    test "defaults to Realtime.Repo if region is not configured" do
      Application.put_env(:realtime, :region, "unknown")
      replica_asserts(Realtime.Repo, Replica.replica())
    end
  end

  describe "handle fly platform" do
    for {region, mod} <- Replica.replicas_fly() do
      setup do
        Application.put_env(:realtime, :platform, :fly)
        Application.put_env(:realtime, :master_region, "special-region")
        :ok
      end

      test "handles #{region} region" do
        Application.put_env(:realtime, :region, unquote(region))
        replica_asserts(unquote(mod), Replica.replica())
      end
    end

    test "defaults to Realtime.Repo if region is not configured" do
      Application.put_env(:realtime, :region, "unknown")
      replica_asserts(Realtime.Repo, Replica.replica())
    end
  end

  describe "main replica module configuration" do
    setup do
      Application.put_env(:realtime, Replica, hostname: "test-replica-host")
      :ok
    end

    test "uses main replica module when configured on AWS platform" do
      Application.put_env(:realtime, :platform, :aws)
      Application.put_env(:realtime, :region, "us-west-1")
      Application.put_env(:realtime, :master_region, "us-east-1")

      replica_asserts(Replica, Replica.replica())
    end

    test "uses main replica module when configured on Fly platform" do
      Application.put_env(:realtime, :platform, :fly)
      Application.put_env(:realtime, :region, "sea")
      Application.put_env(:realtime, :master_region, "sjc")

      replica_asserts(Replica, Replica.replica())
    end

    test "still defaults to Realtime.Repo when region matches master region" do
      Application.put_env(:realtime, :platform, :aws)
      Application.put_env(:realtime, :region, "us-west-1")
      Application.put_env(:realtime, :master_region, "us-west-1")

      replica_asserts(Realtime.Repo, Replica.replica())
    end

    test "uses main replica module when region is unknown" do
      Application.put_env(:realtime, :platform, :aws)
      Application.put_env(:realtime, :region, "unknown-region")
      Application.put_env(:realtime, :master_region, "us-east-1")

      replica_asserts(Replica, Replica.replica())
    end

    test "uses main replica module without platform configuration" do
      Application.delete_env(:realtime, :platform)
      Application.put_env(:realtime, :region, "us-west-1")
      Application.put_env(:realtime, :master_region, "us-east-1")

      replica_asserts(Replica, Replica.replica())
    end
  end

  defp replica_asserts(mod, replica) do
    assert mod == replica
    assert [Ecto.Repo] == replica.__info__(:attributes) |> Keyword.get(:behaviour)
  end
end
