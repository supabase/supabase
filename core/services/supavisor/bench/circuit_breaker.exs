Logger.configure(level: :error)

alias Supavisor.CircuitBreaker

# Initialize the ETS table (idempotent)
try do
  CircuitBreaker.init()
rescue
  ArgumentError -> :ok
end

# --- Setup ---

# Key with 1 failure — exists but not blocked
existing_key = "bench_existing"
CircuitBreaker.record_failure(existing_key, :db_connection)

# Key that tripped the circuit
open_key = "bench_open"
for _ <- 1..100, do: CircuitBreaker.record_failure(open_key, :db_connection)

# No ETS entry
missing_key = "bench_missing"

Benchee.run(
  %{
    "record_failure 200x (new key)" => {
      fn key ->
        for _ <- 1..200, do: CircuitBreaker.record_failure(key, :db_connection)
      end,
      before_each: fn _ -> :erlang.unique_integer() end
    },

    "check (miss — no ETS entry)" => fn ->
      CircuitBreaker.check(missing_key, :db_connection)
    end,
    "check (exists, not blocked)" => fn ->
      CircuitBreaker.check(existing_key, :db_connection)
    end,
    "check (exists, blocked)" => fn ->
      CircuitBreaker.check(open_key, :db_connection)
    end,
  },
  parallel: 10,
  time: 3,
  print: [fast_warning: false]
)
