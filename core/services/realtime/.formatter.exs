[
  import_deps: [:ecto, :ecto_sql, :phoenix, :open_api_spex, :wait_for_it],
  subdirectories: ["priv/*/migrations"],
  plugins: [],
  inputs: ["*.{heex,ex,exs}", "{config,dev,lib,test}/**/*.{heex,ex,exs}", "priv/*/*seeds*.exs"],
  line_length: 120
]
