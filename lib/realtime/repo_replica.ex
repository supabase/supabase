defmodule Realtime.Repo.Replica do
  @moduledoc """
  Generates a read-only replica repo for the region specified in config/runtime.exs.
  """
  use Ecto.Repo,
    otp_app: :realtime,
    adapter: Ecto.Adapters.Postgres,
    read_only: true

  @replicas_fly %{
    "sea" => Realtime.Repo.Replica.SJC,
    "sjc" => Realtime.Repo.Replica.SJC,
    "gru" => Realtime.Repo.Replica.IAD,
    "iad" => Realtime.Repo.Replica.IAD,
    "sin" => Realtime.Repo.Replica.SIN,
    "maa" => Realtime.Repo.Replica.SIN,
    "syd" => Realtime.Repo.Replica.SIN,
    "lhr" => Realtime.Repo.Replica.FRA,
    "fra" => Realtime.Repo.Replica.FRA
  }

  @replicas_aws %{
    "ap-southeast-1" => Realtime.Repo.Replica.Singapore,
    "ap-southeast-2" => Realtime.Repo.Replica.Singapore,
    "eu-west-2" => Realtime.Repo.Replica.London,
    "us-east-1" => Realtime.Repo.Replica.NorthVirginia,
    "us-west-2" => Realtime.Repo.Replica.Oregon,
    "us-west-1" => Realtime.Repo.Replica.SanJose
  }

  for replica_module <- Enum.uniq(Map.values(@replicas_fly) ++ Map.values(@replicas_aws)) do
    defmodule replica_module do
      use Ecto.Repo,
        otp_app: :realtime,
        adapter: Ecto.Adapters.Postgres,
        read_only: true
    end
  end

  @doc """
  Returns the replica repo module for the region specified in config/runtime.exs.
  """
  @spec replica() :: module()
  def replica do
    region = Realtime.Nodes.region()
    master_region = Application.get_env(:realtime, :master_region) || region

    case configured_replica_module(region) do
      nil ->
        Realtime.Repo

      replica ->
        replica_conf = Application.get_env(:realtime, replica)

        cond do
          is_nil(replica_conf) ->
            Realtime.Repo

          region == master_region ->
            Realtime.Repo

          true ->
            replica
        end
    end
  end

  defp configured_replica_module(region) do
    main_replica_config = Application.get_env(:realtime, __MODULE__)

    # If the main replica module is configured we don't bother with specific replica modules
    if main_replica_config do
      __MODULE__
    else
      replicas =
        case Application.get_env(:realtime, :platform) do
          :aws -> @replicas_aws
          :fly -> @replicas_fly
          _ -> %{}
        end

      Map.get(replicas, region)
    end
  end

  if Mix.env() == :test do
    def replicas_aws, do: @replicas_aws

    def replicas_fly, do: @replicas_fly
  end
end
