Application.put_env(:peep, :test_storages, [
  {Realtime.Monitoring.Peep.Partitioned, 3},
  {Realtime.Monitoring.Peep.Partitioned, 1}
])

Code.require_file("../../../../deps/peep/test/shared/storage_test.exs", __DIR__)
