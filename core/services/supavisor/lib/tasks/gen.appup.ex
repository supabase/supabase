defmodule Mix.Tasks.Supavisor.Gen.Appup do
  @moduledoc """
  Generates an appup file for a given release.

  Takes 4 parameters:
  - `:from` - The version from which the upgrade starts.
  - `:to` - The version to which the upgrade ends.
  - `:app` - The application name. Defaults to `"supavisor"`
  - `:path` - The path where the appup file will be generated. Defaults to
  the release directory for the application.

  ## Examples

      # Generate an appup from 0.0.1 to 0.0.2 versions

      mix supavisor.gen.appup --app=supavisor --from=0.0.1 --to=0.0.2
  """

  use Mix.Task
  alias Distillery.Releases.Appup

  @impl true
  def run(args) do
    {parsed, _, _} =
      OptionParser.parse(args, strict: [from: :string, to: :string, app: :string, path: :string])

    app = String.to_existing_atom(parsed[:app] || "supavisor")

    {from_vsn, to_vsn} =
      if !parsed[:from] || !parsed[:to] do
        Mix.Task.run("help", ["supavisor.gen.appup"])
        System.halt(1)
      else
        {parsed[:from], parsed[:to]}
      end

    Mix.shell().info("Generating appup for #{app} from #{from_vsn} to #{to_vsn}...\n")

    rel_dir = Path.join([File.cwd!(), "_build", "#{Mix.env()}", "rel", "supavisor"])
    lib_path = Path.join(rel_dir, "lib")
    path_from = Path.join(lib_path, "#{app}-#{from_vsn}")
    path_to = Path.join(lib_path, "#{app}-#{to_vsn}")
    appup_path = appup_path(app, parsed[:path], path_to, to_vsn)

    transforms =
      case app do
        :supavisor -> [Supavisor.HotUpgrade]
        _other -> []
      end

    case Appup.make(app, from_vsn, to_vsn, path_from, path_to, transforms) do
      {:ok, appup} ->
        Mix.shell().info("Writing appup to #{appup_path}")

        case File.write(appup_path, :io_lib.format("~p.", [appup]), [:utf8]) do
          :ok ->
            Mix.shell().info("Appup:\n#{File.read!(appup_path)}")

          {:error, reason} ->
            Mix.raise("Failed to write appup file: #{reason}")
        end

      {:error, reason} ->
        Mix.raise("Failed to generate appup file: #{inspect(reason)}")
    end
  end

  defp appup_path(app, nil, path_to, _to_vsn), do: Path.join([path_to, "ebin", "#{app}.appup"])

  defp appup_path(app, path, _path_to, to_vsn) do
    cond do
      File.dir?(path) ->
        Path.join(path, "#{app}-#{to_vsn}.appup")

      File.exists?(Path.dirname(path)) ->
        path

      true ->
        raise ArgumentError, "invalid path: #{path}"
    end
  end
end
