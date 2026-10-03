defmodule Supavisor.Protocol do
  @moduledoc """
  Protocol helpers, useful for both backend and frontend messages
  """

  @doc "Maximum allowed size in bytes for a startup packet."
  def max_startup_packet_size, do: 1024

  @doc """
  Alternative to decode/1 that returns the binaries without decoding them
  """
  @spec split_pkts(binary) :: {[binary], binary}
  def split_pkts(binary) do
    do_split_pkts(binary, [])
  end

  defp do_split_pkts(
         <<_char::8, pkt_len::32, _rest::binary-size(pkt_len - 4), rest2::binary>> = bin,
         acc
       ) do
    do_split_pkts(rest2, [:binary.part(bin, 0, pkt_len + 1) | acc])
  end

  defp do_split_pkts(rest, acc) do
    {:lists.reverse(acc), rest}
  end
end
