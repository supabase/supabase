# TODO: https://github.com/elixir-ecto/postgrex/pull/784
[
  {"lib/extensions/postgres_cdc_rls/replications.ex", :call},
  {"lib/extensions/postgres_cdc_rls/replications.ex", :no_return},
  {"lib/extensions/postgres_cdc_rls/replications.ex", :invalid_contract},
  {"lib/extensions/postgres_cdc_rls/subscriptions.ex", :call},
  {"lib/extensions/postgres_cdc_rls/subscriptions.ex", :no_return},
  # params_to_log/1 is only reached from the error branches that the no_return
  # cascade above makes Dialyzer treat as dead, so it is wrongly flagged unused.
  {"lib/extensions/postgres_cdc_rls/subscriptions.ex", :unused_fun},
  # See https://github.com/discord/ex_hash_ring/pull/19
  # ExHashRing types ring node names as binary() (ExHashRing.Node.name), but Muster
  # populates its rings with Erlang node atoms (Ring.set_nodes([node()])). So
  # ExHashRing.Ring.find_node/2's contract returns {:ok, binary()}, while
  # Forum.Muster.router/2 and RegionRings.expected_router/2 correctly spec their
  # result as {:ok, node()}. Dialyzer intersects node() with binary() to none() and
  # wrongly prunes the {:ok, _} branch from both functions' return types, making
  # every {:ok, router_node} match here look unreachable. The values are atoms at
  # runtime and there is no runtime-safe way to re-type them (binary_to_atom would
  # crash on the atoms actually present), so these pattern_match warnings are false
  # positives rooted in the third-party spec.
  {"lib/realtime/gen_rpc/pub_sub.ex", :pattern_match}
]
