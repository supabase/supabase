import Ecto.Adapters.SQL, only: [query: 3]

[
  "create schema if not exists realtime"
]
|> Enum.each(&query(Realtime.Repo, &1, []))
