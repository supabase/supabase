ExUnit.start(capture_log: true)

case :net_kernel.start([:"forum@127.0.0.1"]) do
  {:ok, _pid} -> :ok
  {:error, {:already_started, _pid}} -> :ok
  {:error, reason} -> raise "could not start distribution as forum@127.0.0.1: #{inspect(reason)}"
end

# Copy the real messaging adapter so tests can stub its transport functions
# (`call/6`, `send/3`) with Mimic instead of a bespoke recording adapter.
Mimic.copy(Forum.Adapter.ErlDist)
