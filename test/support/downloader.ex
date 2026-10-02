defmodule Supavisor.Downloader do
  @moduledoc """
  Download and extract files. Used for fetching executables from GitHub
  """

  @doc """
  Ensure that executable `name` exists or fetch.
  """
  @spec ensure(String.t(), %{{atom(), atom()} => String.t()}) :: String.t()
  def ensure(name, sources) do
    case System.find_executable(name) do
      nil -> do_download(name, sources)
      path -> path
    end
  end

  defp do_download(name, sources) do
    path = System.tmp_dir!()
    arch = os_arch()

    source =
      case Map.fetch(sources, arch) do
        {:ok, src} -> src
        :error -> raise "Cannot find source for #{inspect(arch)}"
      end

    {url, file} =
      case source do
        {url, file} -> {url, file}
        url when is_binary(url) -> {url, name}
      end

    out = Path.join(path, file)

    if not File.exists?(out) do
      %Req.Response{status: 200, body: body} = Req.get!(url)

      :ok =
        :erl_tar.extract({:binary, body}, [
          :compressed,
          cwd: to_charlist(path),
          files: [to_charlist(file)]
        ])
    end

    out
  end

  defp os_arch do
    {_, name} = :os.type()

    arch =
      :erlang.system_info(:system_architecture)
      |> List.to_string()
      |> String.split("-", parts: 2)
      |> hd()
      |> String.to_atom()

    {name, arch}
  end
end
