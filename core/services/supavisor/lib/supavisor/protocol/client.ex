defmodule Supavisor.Protocol.Client do
  @moduledoc false

  alias Supavisor.Errors.StartupMessageError

  @spec decode_startup_packet(binary()) :: {:ok, map()} | {:error, StartupMessageError.t()}
  def decode_startup_packet(<<len::integer-32, _protocol::binary-4, rest::binary>>) do
    with {:ok, payload} <- decode_startup_packet_payload(rest) do
      {:ok, %{len: len, payload: payload, tag: :startup}}
    end
  end

  def decode_startup_packet(bin) do
    {:error, %StartupMessageError{reason: :bad_startup_payload, payload: bin}}
  end

  # The startup packet payload is a list of key/value pairs, separated by null bytes.
  # The payload is terminated by an extra null byte. Empty values are valid (e.g. options\x00\x00).
  @spec decode_startup_packet_payload(binary()) ::
          {:ok, map()} | {:error, StartupMessageError.t()}
  defp decode_startup_packet_payload(payload) do
    fields = payload |> String.trim_trailing(<<0>>) |> String.split(<<0>>)

    # If the number of fields is odd, then the payload is malformed
    if rem(length(fields), 2) == 1 do
      {:error, %StartupMessageError{reason: :bad_startup_payload, payload: payload}}
    else
      map =
        fields
        |> Enum.chunk_every(2)
        |> Enum.map(fn
          ["options" = k, v] ->
            parsed = Supavisor.Protocol.StartupOptions.parse(v)

            # Compatibility: options are not following the standard format, try query_decoding them
            if map_size(parsed) > 0 do
              {k, parsed}
            else
              {k, URI.decode_query(v, %{}, :rfc3986)}
            end

          [k, v] ->
            {k, v}
        end)
        |> Map.new()

      # We only do light validation on the fields in the payload. The only field we use at the
      # moment is `user`. If that's missing, this is a bad payload.
      if Map.has_key?(map, "user") do
        {:ok, map}
      else
        {:error, %StartupMessageError{reason: :missing_user, payload: payload}}
      end
    end
  end
end
