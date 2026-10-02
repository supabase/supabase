defmodule Realtime.Release do
  @moduledoc """
  Used for executing DB release tasks when run in production without Mix
  installed.
  """
  @app :realtime

  def migrate do
    load_app()

    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  def rollback(repo, version) do
    load_app()
    {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :down, to: version))
  end

  def seeds(repo) do
    load_app()
    {:ok, _} = Application.ensure_all_started(:realtime)

    {:ok, {:ok, _}, _} =
      Ecto.Migrator.with_repo(repo, fn _repo ->
        seeds_file = "#{:code.priv_dir(@app)}/repo/seeds.exs"

        if File.regular?(seeds_file) do
          {:ok, Code.eval_file(seeds_file)}
        else
          {:error, "Seeds file not found."}
        end
      end)
  end

  defp repos do
    Application.fetch_env!(@app, :ecto_repos)
  end

  defp load_app do
    Application.load(@app)
  end
end
