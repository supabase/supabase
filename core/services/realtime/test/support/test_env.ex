defmodule TestEnv do
  @moduledoc false
  # The ports and node names this run owns. config/test.exs claims the ports; names carry its
  # run tag, so concurrent runs never collide.
  #
  # A run is identified by the endpoint port it took out of 4002..4999, and every other port it
  # uses sits that same offset (0..997) from a start of its own:
  #
  #   endpoint  4002..4999
  #   gen_rpc   5969..7964, the local node's server and client port
  #   peers     10_000..25_967 for http and 26_000..41_967 for gen_rpc,
  #             :test_peer_ports_per_run (16) of each per run
  #
  # The two peer starts are 16_000 apart, which at 16 ports per run is what keeps every run's
  # peers clear of every other run's ports.

  # One slot per peer, offset from both peer port starts, so no test has to know the arithmetic.
  # The region clusters hold separate slots so neither reuses the other's port. A run gets
  # :test_peer_ports_per_run ports of each kind, so that is how many slots fit here.
  @peer_slots %{
    default: 0,
    us_node: 1,
    ap2_nodeX: 2,
    ap2_nodeY: 3,
    holder_us: 4,
    bystander_us: 5,
    holder_ap: 6,
    bystander_ap: 7,
    rr_int_a: 8,
    rr_int_b: 9,
    rr_int_c: 10,
    bad_tcp: 11
  }

  # Labels this run's databases and containers. config/test.exs takes it from TENANT (or
  # TEST_RUN), and otherwise from the endpoint port. Empty for the first run on a machine on the
  # default tenant, which therefore looks exactly like it did before any of this.
  @spec run_tag() :: binary()
  def run_tag, do: Application.fetch_env!(:realtime, :test_run_tag)

  # Node names get the port rather than the tag: they show up inside inspected maps in logs that
  # tests assert on, so they have to stay short.
  @spec node_suffix() :: binary()
  def node_suffix, do: Application.fetch_env!(:realtime, :test_node_suffix)

  # The endpoint port this run claimed, which is also what a later run probes to decide
  # whether this run is still alive.
  @spec http_port() :: pos_integer()
  def http_port, do: Application.fetch_env!(:realtime, :test_http_port)

  # Built in config/test.exs, because mix.exs needs this name before this module is compiled.
  @spec node_name() :: node()
  def node_name, do: Application.fetch_env!(:realtime, :test_node_name)

  @spec peer_name(atom() | charlist() | binary()) :: atom() | charlist() | binary()
  def peer_name(name) do
    case node_suffix() do
      "" -> name
      tag -> :"#{name}#{tag}"
    end
  end

  @spec peer_node(atom() | charlist() | binary()) :: node()
  def peer_node(name), do: :"#{peer_name(name)}@127.0.0.1"

  @spec peer_http_port(atom()) :: pos_integer()
  def peer_http_port(peer \\ :default),
    do: Application.fetch_env!(:realtime, :test_peer_http_base) + slot!(peer)

  @spec peer_gen_rpc_port(atom()) :: pos_integer()
  def peer_gen_rpc_port(peer \\ :default),
    do: Application.fetch_env!(:realtime, :test_peer_gen_rpc_base) + slot!(peer)

  @spec peers() :: [atom()]
  def peers, do: Map.keys(@peer_slots)

  defp slot!(peer) do
    case Map.fetch(@peer_slots, peer) do
      {:ok, slot} ->
        slot

      :error ->
        raise ArgumentError,
              "unknown peer #{inspect(peer)}: add it to TestEnv's peer slots. Known: #{inspect(Enum.sort(peers()))}"
    end
  end
end
