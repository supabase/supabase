import Ecto.Adapters.SQL, only: [query: 3]

[
  "create schema if not exists _supavisor"
]
|> Enum.each(&query(Supavisor.Repo, &1, []))
