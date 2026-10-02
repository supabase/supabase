defmodule RealtimeWeb.Dashboard.ProcessDump do
  @moduledoc """
  Live Dashboard page to dump the current processes tree
  """
  use Phoenix.LiveDashboard.PageBuilder

  @impl true
  def menu_link(_, _) do
    {:ok, "Process Dump"}
  end

  @impl true
  def mount(_, _, socket) do
    ts = :os.system_time(:millisecond)
    name = "process_dump_#{ts}"
    content = dump_processes(name)
    {:ok, socket |> assign(content: content) |> assign(name: name)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="prose">
      <h1>Process Dump</h1>
      <a download={"#{@name}.tar.gz"} href={"data:application/x-compressed;base64,#{@content}"}>
        Download
      </a>
      <br />After you untar the file, you can use `File.read!("filename") |> :erlang.binary_to_term` to check the contents
    </div>
    """
  end

  defp dump_processes(name) do
    term = Process.list() |> Enum.map(&Process.info/1) |> :erlang.term_to_binary()
    path = "/tmp/#{name}"
    File.write!(path, term)
    System.cmd("tar", ["-czf", "#{path}.tar.gz", path])
    "#{path}.tar.gz" |> File.read!() |> Base.encode64()
  end
end
