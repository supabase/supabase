defmodule Mix.Tasks.Supavisor.Gen.Relup do
  @moduledoc """
  Generates an appup file for a given release.

  ## Examples

      # Generate an appup from 0.0.1 to 0.0.2 versions

      mix supavisor.gen.appup --from=0.0.1 --to=0.0.2
  """

  use Mix.Task

  @impl true
  def run(args) do
    {parsed, _, _} = OptionParser.parse(args, strict: [from: :string, to: :string])

    {from_vsn, to_vsn} =
      if !parsed[:from] || !parsed[:to] do
        Mix.Task.run("help", ["supavisor.gen.relup"])
        System.halt(1)
      else
        {parsed[:from], parsed[:to]}
      end

    IO.puts("Generating relup from #{from_vsn} to #{to_vsn}...\n")

    rel_dir = Path.join([File.cwd!(), "_build", "#{Mix.env()}", "rel", "supavisor"])
    prev_rel_dir = Path.join([rel_dir, "releases", from_vsn])
    curr_rel_dir = Path.join([rel_dir, "releases", to_vsn])
    lib_path = Path.join(rel_dir, "lib")
    relup_path = Path.join(curr_rel_dir, "relup")

    opts = [
      {:path, [Path.join(lib_path, "*/ebin") |> to_charlist()]},
      {:outdir, to_charlist(curr_rel_dir)}
    ]

    rel1 = Path.join(prev_rel_dir, "supavisor") |> to_charlist()
    rel2 = Path.join(curr_rel_dir, "supavisor") |> to_charlist()

    case :systools.make_relup(rel2, [rel1], [rel1], opts) do
      :ok ->
        IO.puts("Writing relup to #{relup_path}\n")

        case File.read(relup_path) do
          {:ok, content} ->
            IO.puts("Relup:\n#{content}")

          {:error, reason} ->
            Mix.raise("Failed to read relup file: #{reason}")
        end

      other ->
        Mix.raise("Failed to generate relup file: #{other}")
    end
  end
end
