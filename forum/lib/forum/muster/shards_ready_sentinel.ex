defmodule Forum.Muster.ShardsReadySentinel do
  @moduledoc false
  # One-shot startup step, not a supervised process: tells the coordinator that
  # every claim shard has finished its own init, then returns `:ignore` so
  # Forum.Supervisor keeps no pid for it.
  #
  # Forum.Supervisor places this as the LAST child of the outer :rest_for_one,
  # right after shards_supervisor_spec. Supervisor.start_link blocks its caller
  # until the started child's own init has returned, and a supervisor starts
  # its children strictly in list order, so this module's start_link/1 cannot
  # run until shards_supervisor's init has returned, which itself only returns
  # once every shard's init has returned. The send below is therefore a
  # guarantee, not a race: by construction every shard is registered and past
  # its own init before this ever fires.
  #
  # Being last also means any :rest_for_one cascade that restarts
  # shards_supervisor (a shard crash-looping past its own max_restarts, or a
  # coordinator/ring crash further up the list) restarts this sentinel too,
  # re-arming the signal exactly when the shards it describes are fresh.
  @spec start_link(atom) :: :ignore
  def start_link(scope) do
    send(Forum.Supervisor.name(scope), :muster_shards_ready)
    :ignore
  end
end
