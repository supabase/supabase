alias Realtime.GenCounter

counter = :counters.new(1, [:write_concurrency])
_gen_counter = GenCounter.new(:any_term)

Benchee.run(%{
  ":counters.add" => fn -> :counters.add(counter, 1, 1) end,
  "GenCounter.add" => fn -> GenCounter.add(:any_term) end
})
